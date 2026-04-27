const { OpFailReason } = require('./opFailReason');
const { storage } = require('./storage');

function ok(data = {}, message = '') {
  return { ok: true, failReason: null, message, data };
}

function fail(failReason, message = '', data = {}) {
  return { ok: false, failReason, message, data };
}

const AuthService = {
  register(accountId, token) {
    storage.accounts.set(accountId, token);
    if (!storage.accountCharacters.has(accountId)) storage.accountCharacters.set(accountId, []);
    return ok({ accountId });
  },
  authorize(accountId, token) {
    return storage.accounts.get(accountId) === token;
  },
};

const ProfileService = {
  loadOrCreate(accountId, characterId) {
    if (!storage.profiles.has(characterId)) {
      storage.profiles.set(characterId, {
        characterId,
        accountId,
        characterName: characterId,
        characterClass: 'Adventurer',
        level: 1,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        statuses: new Set(),
        cooldownEnds: new Map(),
      });
    }
    if (!storage.inventories.has(characterId)) {
      storage.inventories.set(characterId, { maxSlots: 30, items: new Map() });
    }
    if (!storage.equipments.has(characterId)) {
      storage.equipments.set(characterId, { slots: new Map() });
    }

    const accountChars = storage.accountCharacters.get(accountId) || [];
    if (!accountChars.includes(characterId)) {
      accountChars.push(characterId);
      storage.accountCharacters.set(accountId, accountChars);
    }

    return storage.profiles.get(characterId);
  },
  get(characterId) {
    return storage.profiles.get(characterId) || null;
  },
};

const IdempotencyService = {
  replayOrStart(key, operation) {
    const record = storage.idempotency.get(key);
    if (!record) return null;
    if (record.operation !== operation) {
      return fail(OpFailReason.IDEMPOTENCY_CONFLICT, 'Idempotency key already used for a different operation');
    }
    return record.result;
  },
  commit(key, operation, result) {
    storage.idempotency.set(key, { operation, result });
  },
};

const CharacterService = {
  MAX_CHARACTERS_PER_ACCOUNT: 3,
  ALLOWED_CLASSES: new Set(['Warrior', 'Mage', 'Archer', 'Adventurer']),

  _characterSummary(character) {
    return {
      characterId: character.characterId,
      characterName: character.characterName,
      characterClass: character.characterClass,
      level: character.level,
    };
  },

  _accountCharacters(accountId) {
    const charIds = storage.accountCharacters.get(accountId) || [];
    return charIds.map((id) => storage.profiles.get(id)).filter(Boolean);
  },

  createCharacter(accountId, characterName, characterClass, { idempotencyKey }) {
    const op = 'character.create';
    const replay = IdempotencyService.replayOrStart(idempotencyKey, op);
    if (replay) return replay;

    if (!storage.accounts.has(accountId)) {
      const result = fail(OpFailReason.NOT_FOUND, 'Account not found');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const normalizedName = characterName.trim();
    if (!normalizedName) {
      const result = fail(OpFailReason.MISSING_DATA_PROFILE, 'Character name is required');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    if (!this.ALLOWED_CLASSES.has(characterClass)) {
      const result = fail(OpFailReason.MISSING_DATA_PROFILE, 'Invalid character class');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const accountChars = storage.accountCharacters.get(accountId) || [];
    if (accountChars.length >= this.MAX_CHARACTERS_PER_ACCOUNT) {
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, 'Character limit reached');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    if (!storage.characterNamesByAccount.has(accountId)) {
      storage.characterNamesByAccount.set(accountId, new Set());
    }
    const names = storage.characterNamesByAccount.get(accountId);
    const loweredName = normalizedName.toLowerCase();
    if (names.has(loweredName)) {
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, 'Character name already exists');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const characterId = `char_${storage.profiles.size + 1}`;
    const profile = {
      characterId,
      accountId,
      characterName: normalizedName,
      characterClass,
      level: 1,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      statuses: new Set(),
      cooldownEnds: new Map(),
    };

    storage.profiles.set(characterId, profile);
    storage.inventories.set(characterId, { maxSlots: 30, items: new Map() });
    storage.equipments.set(characterId, { slots: new Map() });
    accountChars.push(characterId);
    storage.accountCharacters.set(accountId, accountChars);
    names.add(loweredName);

    const result = ok({ character: this._characterSummary(profile) });
    IdempotencyService.commit(idempotencyKey, op, result);
    return result;
  },

  listCharacters(accountId) {
    if (!storage.accounts.has(accountId)) {
      return fail(OpFailReason.NOT_FOUND, 'Account not found');
    }

    return ok({
      characters: this._accountCharacters(accountId).map((c) => this._characterSummary(c)),
      activeCharacterId: storage.activeCharacterByAccount.get(accountId) || null,
      maxCharacters: this.MAX_CHARACTERS_PER_ACCOUNT,
    });
  },

  selectCharacter(accountId, characterId, { idempotencyKey }) {
    const op = 'character.select';
    const replay = IdempotencyService.replayOrStart(idempotencyKey, op);
    if (replay) return replay;

    if (!storage.accounts.has(accountId)) {
      const result = fail(OpFailReason.NOT_FOUND, 'Account not found');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const accountChars = storage.accountCharacters.get(accountId) || [];
    if (!accountChars.includes(characterId)) {
      const result = fail(OpFailReason.NOT_FOUND, 'Character not found for this account');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    storage.activeCharacterByAccount.set(accountId, characterId);
    const result = ok({ selectedCharacter: this._characterSummary(storage.profiles.get(characterId)) });
    IdempotencyService.commit(idempotencyKey, op, result);
    return result;
  },
};

const MainMenuService = {
  load(accountId) {
    const characters = CharacterService.listCharacters(accountId);
    if (!characters.ok) return characters;

    return ok({
      menu: {
        accountId,
        characters: characters.data.characters,
        activeCharacterId: characters.data.activeCharacterId,
        maxCharacters: characters.data.maxCharacters,
        actions: ['create_character', 'select_character', 'enter_world'],
      },
    });
  },
};

const InventoryService = {
  _state(characterId) {
    return storage.inventories.get(characterId) || null;
  },
  addItem(characterId, itemId, count, { idempotencyKey }) {
    const op = 'inventory.addItem';
    const replay = IdempotencyService.replayOrStart(idempotencyKey, op);
    if (replay) return replay;

    const state = this._state(characterId);
    if (!state) {
      const result = fail(OpFailReason.NOT_FOUND, 'Inventory not found');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }
    if (count <= 0) {
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, 'Count must be > 0');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }
    if (!state.items.has(itemId) && state.items.size >= state.maxSlots) {
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, 'Inventory full');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const current = state.items.get(itemId) || 0;
    state.items.set(itemId, current + count);

    const result = ok({ itemId, count: state.items.get(itemId) });
    IdempotencyService.commit(idempotencyKey, op, result);
    return result;
  },
  removeItem(characterId, itemId, count, { idempotencyKey }) {
    const op = 'inventory.removeItem';
    const replay = IdempotencyService.replayOrStart(idempotencyKey, op);
    if (replay) return replay;

    const state = this._state(characterId);
    if (!state) {
      const result = fail(OpFailReason.NOT_FOUND, 'Inventory not found');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const current = state.items.get(itemId) || 0;
    if (current < count) {
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, 'Not enough item count');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const remaining = current - count;
    if (remaining === 0) state.items.delete(itemId);
    else state.items.set(itemId, remaining);

    const result = ok({ itemId, remaining });
    IdempotencyService.commit(idempotencyKey, op, result);
    return result;
  },
};

const EquipmentService = {
  _state(characterId) {
    return storage.equipments.get(characterId) || null;
  },
  equipItem(characterId, slot, itemId, { idempotencyKey }) {
    const op = 'equipment.equipItem';
    const replay = IdempotencyService.replayOrStart(idempotencyKey, op);
    if (replay) return replay;

    const eq = this._state(characterId);
    if (!eq) {
      const result = fail(OpFailReason.NOT_FOUND, 'Equipment not found');
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const reserve = InventoryService.removeItem(characterId, itemId, 1, { idempotencyKey: `${idempotencyKey}:reserve` });
    if (!reserve.ok) {
      const result = fail(reserve.failReason, `Reserve failed: ${reserve.message}`);
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const oldItem = eq.slots.get(slot);
    try {
      eq.slots.set(slot, itemId);
      if (oldItem) {
        const restoreOld = InventoryService.addItem(characterId, oldItem, 1, { idempotencyKey: `${idempotencyKey}:old_restore` });
        if (!restoreOld.ok) throw new Error('Failed to restore old item');
      }
    } catch (err) {
      InventoryService.addItem(characterId, itemId, 1, { idempotencyKey: `${idempotencyKey}:rollback_reserved` });
      const result = fail(OpFailReason.INTERNAL_STATE_CONFLICT, `Equip failed: ${err.message}`);
      IdempotencyService.commit(idempotencyKey, op, result);
      return result;
    }

    const result = ok({ slot, itemId });
    IdempotencyService.commit(idempotencyKey, op, result);
    return result;
  },
};

const CombatValidationService = {
  abilitySpecs: {
    Fireball: { abilityId: 'Fireball', resourceType: 'mp', resourceCost: 20, cooldownSec: 5, requiredStatusAbsent: 'Stun' },
    QuickStrike: { abilityId: 'QuickStrike', resourceType: 'mp', resourceCost: 5, cooldownSec: 1, requiredStatusAbsent: 'Stun' },
  },
  validateAndCommitAbility(characterId, abilityId, now = Date.now() / 1000) {
    const profile = ProfileService.get(characterId);
    if (!profile) return fail(OpFailReason.NOT_FOUND, 'Character not found');

    const spec = this.abilitySpecs[abilityId];
    if (!spec) return fail(OpFailReason.MISSING_DATA_PROFILE, 'Ability profile missing');

    if (spec.requiredStatusAbsent && profile.statuses.has(spec.requiredStatusAbsent)) {
      return fail(OpFailReason.BLOCKED_BY_STATUS, 'Ability blocked by status');
    }

    const cooldownEnd = profile.cooldownEnds.get(abilityId) || 0;
    if (cooldownEnd > now) return fail(OpFailReason.ON_COOLDOWN, 'Ability on cooldown');

    if (spec.resourceType === 'mp' && profile.mp < spec.resourceCost) {
      return fail(OpFailReason.NOT_ENOUGH_RESOURCE, 'Not enough MP');
    }

    if (spec.resourceType === 'mp') {
      profile.mp -= spec.resourceCost;
    }
    profile.cooldownEnds.set(abilityId, now + spec.cooldownSec);

    return ok({ abilityId, mpLeft: profile.mp, cooldownEnd: profile.cooldownEnds.get(abilityId) });
  },
};

function seedDemoState() {
  AuthService.register('acc_1', 'token_1');
  const create = CharacterService.createCharacter('acc_1', 'Aerin', 'Mage', { idempotencyKey: 'seed:create_char' });
  const characterId = create.ok ? create.data.character.characterId : 'char_1';
  CharacterService.selectCharacter('acc_1', characterId, { idempotencyKey: 'seed:select_char' });
  const profile = ProfileService.get(characterId);

  InventoryService.addItem(characterId, 'Sword_01', 1, { idempotencyKey: 'seed:add_sword' });
  InventoryService.addItem(characterId, 'Potion_01', 5, { idempotencyKey: 'seed:add_potions' });
  return {
    ...profile,
    statuses: [...profile.statuses],
    cooldownEnds: Object.fromEntries(profile.cooldownEnds.entries()),
  };
}

module.exports = {
  AuthService,
  ProfileService,
  IdempotencyService,
  CharacterService,
  MainMenuService,
  InventoryService,
  EquipmentService,
  CombatValidationService,
  seedDemoState,
};
