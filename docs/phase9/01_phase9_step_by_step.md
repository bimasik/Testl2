# 01. Phase 9 — экипировка (подробно по нодам)

Фаза 9 начинается после закрытой Phase 8 (инвентарь и pickup уже работают).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_Equipment`
- `Content/_Core/Data/Enums/E_EquipmentSlot`
- `Content/_Core/Data/Structs/S_EquippedItem`
- `Content/_Core/UI/WBP_Equipment_Min`

Обнови:
- `BPC_Inventory`
- `BP_PlayerCharacter`

---

## Итерация 2 — enum и структура

## `E_EquipmentSlot`
Минимальные слоты:
1. `WeaponMain`
2. `Helmet`
3. `Chest`
4. `Gloves`
5. `Boots`

## `S_EquippedItem`
Поля:
1. `Slot` (`E_EquipmentSlot`)
2. `ItemId` (`Name`)
3. `Count` (`int`, default `1`)

> На этой фазе считаем, что экипируемые предметы всегда по 1 штуке в слоте.

---

## Итерация 3 — контракт между инвентарем и экипировкой

В `BPC_Inventory` добавь функции (если их еще нет):
1. `RemoveItem(ItemId Name, Count int)` -> `bool`
2. `HasItem(ItemId Name, Count int)` -> `bool`

Требование:
- `RemoveItem` и `AddItem` обязаны дергать `OnInventoryChanged` при успешном изменении.

---

## Итерация 4 — скелет `BPC_Equipment`

## Переменные
1. `OwnerActor` (`Actor`)
2. `OwnerInventory` (`BPC_Inventory` ref)
3. `EquippedItems` (`Array<S_EquippedItem>`)

## Dispatchers
- `OnEquipmentChanged()`

## Функции
1. `InitializeEquipment`
2. `FindEquippedBySlot(Slot E_EquipmentSlot)` -> `bool Found`, `S_EquippedItem Item`
3. `CanEquip(ItemId Name, Slot E_EquipmentSlot)` -> `bool`
4. `EquipItem(ItemId Name, Slot E_EquipmentSlot)` -> `bool`
5. `UnequipItem(Slot E_EquipmentSlot)` -> `bool`
6. `IsSlotBusy(Slot E_EquipmentSlot)` -> `bool`

---

## Итерация 5 — `InitializeEquipment` (node-by-node)

Цель: один раз закешировать зависимости, без спама Cast в UI/input.

1. Event `BeginPlay`
2. `Get Owner` -> `Set OwnerActor`
3. `Get Component By Class` (`BPC_Inventory`) на `OwnerActor`
4. `Cast To BPC_Inventory`
5. `Set OwnerInventory`
6. `Call OnEquipmentChanged`

Проверка:
- `OwnerInventory` валиден у игрока.

---

## Итерация 6 — `FindEquippedBySlot` (node-by-node)

Inputs:
- `Slot`

Outputs:
- `Found`
- `Item`

1. `Set Found = false`
2. `ForEachLoop` по `EquippedItems`
3. `Branch (ArrayElement.Slot == Slot)`
4. True:
   - `Set Item = ArrayElement`
   - `Set Found = true`
   - завершить поиск (через флаг/Break)
5. Return

---

## Итерация 7 — `EquipItem` (node-by-node)

Inputs:
- `ItemId`
- `Slot`

Output:
- `bool`

Логика:
1. `IsValid(OwnerInventory)` -> Branch (false => return false)
2. `CanEquip(ItemId, Slot)` -> Branch (false => return false)
3. `IsSlotBusy(Slot)` -> Branch
   - true -> сначала `UnequipItem(Slot)` (если false => return false)
4. `OwnerInventory.HasItem(ItemId, 1)` -> Branch (false => return false)
5. `OwnerInventory.RemoveItem(ItemId, 1)` -> Branch (false => return false)
6. `Make S_EquippedItem` (`Slot`, `ItemId`, `Count=1`)
7. `Add` в `EquippedItems`
8. `Call OnEquipmentChanged`
9. Return true

Важно:
- Если снятие старого предмета не удалось (например нет места в инвентаре), новый предмет не экипировать.

---

## Итерация 8 — `UnequipItem` (node-by-node)

Input:
- `Slot`

Output:
- `bool`

1. `IsValid(OwnerInventory)` -> Branch (false => return false)
2. `FindEquippedBySlot(Slot)` -> `Found`, `Item`
3. `Branch(Found)` (false => return false)
4. `OwnerInventory.AddItem(Item.ItemId, 1)` -> Branch
   - false => return false
5. Найти индекс предмета в `EquippedItems` по `Slot`
6. `RemoveIndex`
7. `Call OnEquipmentChanged`
8. Return true

---

## Итерация 9 — `CanEquip` и валидации

Минимальная версия (этой фазы):
1. `Branch(ItemId != None)`
2. `Branch(Slot is valid enum)`
3. Return true, если оба условия соблюдены

Расширение (опционально):
- добавить DataTable соответствия `ItemId -> AllowedSlot` и проверять тип предмета.

---

## Итерация 10 — интеграция в `BP_PlayerCharacter`

1. Add Component -> `BPC_Equipment`
2. Проверить, что `BPC_Inventory` добавлен раньше в списке компонентов (чтобы в `BeginPlay` ссылка была доступна).
3. Временный dev-вызов:
   - `Input: E` -> `EquipItem(TestItemId, WeaponMain)`
   - `Input: R` -> `UnequipItem(WeaponMain)`

> Это временная отладка. Позже заменится на полноценный UI.

---

## Итерация 11 — `WBP_Equipment_Min`

Цель: видеть занятые слоты и `ItemId` в каждом слоте.

Логика:
1. Получить `BPC_Equipment` от игрока (1 раз при `Construct`, с валидацией).
2. Подписаться на `OnEquipmentChanged`.
3. На событии:
   - очистить список слотов
   - пройти по всем значениям `E_EquipmentSlot`
   - показать `Empty` или `ItemId`

Правило:
- UI читает состояние через компонент/dispatchers, без Cast в каждом `Tick`.

---

## Итерация 12 — финальный smoke test

1. В инвентаре есть предмет `Sword_01` x1.
2. `EquipItem(Sword_01, WeaponMain)` возвращает true.
3. Предмет исчезает из инвентаря и появляется в `EquippedItems`.
4. Повторный `EquipItem` в тот же слот корректно переэкипирует (через safe unequip).
5. `UnequipItem(WeaponMain)` возвращает предмет обратно в инвентарь.
6. Если в инвентаре нет места, `UnequipItem` не ломает состояние слота.
7. `OnEquipmentChanged` и `OnInventoryChanged` срабатывают в ожидаемые моменты.
8. Нет compile errors в:
   - `BPC_Equipment`
   - `BPC_Inventory`
   - `BP_PlayerCharacter`
   - `WBP_Equipment_Min`

Если все пункты true — Phase 9 закрыта.
