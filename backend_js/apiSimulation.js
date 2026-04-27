const {
  CharacterService,
  CombatValidationService,
  EquipmentService,
  InventoryService,
  MainMenuService,
  seedDemoState,
} = require('./services');

console.log('== seed ==');
console.log(seedDemoState());

console.log('\n== main menu ==');
console.log(MainMenuService.load('acc_1'));

console.log('\n== create second character ==');
const created = CharacterService.createCharacter('acc_1', 'Brakka', 'Warrior', { idempotencyKey: 'menu:create:1' });
console.log(created);

console.log('\n== select character ==');
if (created.ok) {
  console.log(CharacterService.selectCharacter('acc_1', created.data.character.characterId, { idempotencyKey: 'menu:select:1' }));
}

console.log('\n== equip sword ==');
console.log(EquipmentService.equipItem('char_1', 'WeaponMain', 'Sword_01', { idempotencyKey: 'equip:1' }));

console.log('\n== replay same idempotency key ==');
console.log(EquipmentService.equipItem('char_1', 'WeaponMain', 'Sword_01', { idempotencyKey: 'equip:1' }));

console.log('\n== ability commit ==');
console.log(CombatValidationService.validateAndCommitAbility('char_1', 'Fireball'));

console.log('\n== add item with idempotency ==');
console.log(InventoryService.addItem('char_1', 'Potion_01', 2, { idempotencyKey: 'inv:add:1' }));
console.log(InventoryService.addItem('char_1', 'Potion_01', 2, { idempotencyKey: 'inv:add:1' }));
