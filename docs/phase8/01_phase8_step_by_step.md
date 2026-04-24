# 01. Phase 8 — инвентарь и подбор лута (подробно по нодам)

Фаза 8 начинается после закрытой Phase 7 (world-drop уже спавнится).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_Inventory`
- `Content/_Core/Data/Structs/S_InventoryItem`
- `Content/_Core/Input/IA_InteractPickup`
- `Content/_Core/UI/WBP_Inventory_Min`

Обнови:
- `IMC_PlayerBase`
- `BP_LootDropActor`
- `BP_PlayerCharacter`

---

## Итерация 2 — структура `S_InventoryItem`

Поля:
1. `ItemId` (`Name`)
2. `Count` (`int`)
3. `MaxStack` (`int`, default `999`)

> На этой фазе `MaxStack` можно хранить прямо в структуре, без отдельной item-базы.

---

## Итерация 3 — `IA_InteractPickup`

- Value Type: `Digital`
- Trigger: `Pressed`
- Mapping: `E`

Добавь в `IMC_PlayerBase`.

---

## Итерация 4 — `BPC_Inventory` (переменные и функции)

## Переменные
1. `Items` (`Array<S_InventoryItem>`)
2. `MaxSlots` (`int`, default `30`)
3. `OwnerActor` (`Actor`)

## Dispatchers
- `OnInventoryChanged()`

## Функции
1. `InitializeInventory`
2. `AddItem(ItemId Name, Count int)` -> `bool`
3. `TryStackItem(ItemId Name, Count int)` -> `int Remaining`
4. `AddNewSlot(ItemId Name, Count int)` -> `bool`
5. `RemoveItem(ItemId Name, Count int)` -> `bool`
6. `HasItem(ItemId Name, Count int)` -> `bool`

---

## Итерация 5 — `InitializeInventory` (node-by-node)

1. `Get Owner` -> `Set OwnerActor`
2. `Clear Items` (опционально для dev reset)
3. `Call OnInventoryChanged`

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeInventory`

---

## Итерация 6 — `TryStackItem` (node-by-node)

Inputs:
- `ItemId`
- `Count`
Output:
- `Remaining`

Логика:
1. `Set Remaining = Count`
2. `ForEachLoop` по `Items`
3. Если `ArrayElement.ItemId == ItemId`:
   - `FreeSpace = MaxStack - Count`
   - `ToAdd = Min(FreeSpace, Remaining)`
   - `Count += ToAdd`
   - `Remaining -= ToAdd`
4. Если `Remaining <= 0` -> early stop (или через флаг)
5. Return `Remaining`

---

## Итерация 7 — `AddNewSlot` (node-by-node)

1. `Length(Items) < MaxSlots` -> Branch
2. True:
   - `Make S_InventoryItem`
   - `Add` to `Items`
   - Return true
3. False:
   - Return false

---

## Итерация 8 — `AddItem` (node-by-node)

1. Input `ItemId`, `Count`
2. `Branch (Count > 0)`
3. `Remaining = TryStackItem(ItemId, Count)`
4. `While Remaining > 0` (в BP через loop+флаг):
   - `ToPlace = Min(Remaining, MaxStackForThisItem)`
   - `AddNewSlot(ItemId, ToPlace)` -> Branch
   - False -> Return false
   - `Remaining -= ToPlace`
5. `Call OnInventoryChanged`
6. Return true

---

## Итерация 9 — доработка `BP_LootDropActor`

Добавь функцию:
- `TryPickup(PickerActor Actor)` -> `bool`

Node-by-node:
1. `IsValid(PickerActor)` -> Branch
2. `Get Component By Class` (`BPC_Inventory`) на `PickerActor`
3. `Cast To BPC_Inventory`
4. `Call AddItem(ItemId, Count)` -> `bAdded`
5. `Branch(bAdded)`:
   - True -> `DestroyActor(self)` + Return true
   - False -> Return false

---

## Итерация 10 — интеграция в `BP_PlayerCharacter`

### Добавь компонент
- Add Component -> `BPC_Inventory`

### Input event `IA_InteractPickup`
Node-by-node:
1. Event `IA_InteractPickup (Started)`
2. `SphereOverlapActors` вокруг игрока (например radius `200`)
3. `ForEachLoop` по найденным акторам
4. `Cast To BP_LootDropActor`
5. `Call TryPickup(self)`
6. Если успех -> break loop

---

## Итерация 11 — минимальный UI инвентаря

## `WBP_Inventory_Min`
Показывает список `ItemId x Count`.

Логика:
1. Подписаться на `BPC_Inventory.OnInventoryChanged`
2. При событии:
   - очистить список
   - пройти по `Items`
   - добавить строки текста

---

## Итерация 12 — финальный smoke test

1. Убиваем NPC -> выпадает дроп (из Phase 7).
2. Подходим и жмем `E` -> дроп исчезает.
3. Предмет появляется в `BPC_Inventory.Items`.
4. При повторном подборе одинаковый item стакается.
5. Если слоты заполнены, `AddItem` возвращает false и дроп не исчезает.
6. UI обновляется через `OnInventoryChanged`.
7. Нет compile errors в:
   - `BPC_Inventory`
   - `BP_LootDropActor`
   - `BP_PlayerCharacter`
   - `WBP_Inventory_Min`

Если все пункты true — Phase 8 закрыта.
