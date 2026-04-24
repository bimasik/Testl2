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
  const profile = ProfileService.loadOrCreate('acc_1', 'char_1');
  InventoryService.addItem('char_1', 'Sword_01', 1, { idempotencyKey: 'seed:add_sword' });
  InventoryService.addItem('char_1', 'Potion_01', 5, { idempotencyKey: 'seed:add_potions' });
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
  InventoryService,
  EquipmentService,
  CombatValidationService,
  seedDemoState,
};
