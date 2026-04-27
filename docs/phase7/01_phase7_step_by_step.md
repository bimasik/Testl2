# 01. Phase 7 — базовый дроп (подробно по нодам)

Фаза 7 начинается после закрытой Phase 6 (NPC уже умирают/респавнятся).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_LootDrop`
- `Content/_Core/Data/Structs/S_LootEntry`
- `Content/_Core/Data/DT/DT_LootTable_Basic`
- `Content/_Core/Blueprints/World/BP_LootDropActor`

Обнови:
- `BP_EnemyBase`

---

## Итерация 2 — структура `S_LootEntry`

Поля:
1. `ItemId` (`Name`)
2. `DropChance` (`float`, 0..1)
3. `MinCount` (`int`)
4. `MaxCount` (`int`)

> На этой фазе используем минимальный item id (Name), без полной item-системы.

---

## Итерация 3 — DataTable `DT_LootTable_Basic`

Создай строки (пример):
- `GoblinBasic`:
  - `ItemId=adena`, `DropChance=1.0`, `MinCount=5`, `MaxCount=20`
  - `ItemId=cloth_scrap`, `DropChance=0.35`, `MinCount=1`, `MaxCount=2`
- `OrcBasic`:
  - `ItemId=adena`, `DropChance=1.0`, `MinCount=12`, `MaxCount=35`
  - `ItemId=iron_ore`, `DropChance=0.25`, `MinCount=1`, `MaxCount=1`

---

## Итерация 4 — `BP_LootDropActor`

## Переменные
1. `ItemId` (`Name`)
2. `Count` (`int`)

## Компоненты
- StaticMesh (или billboard)
- SphereCollision (для будущего pickup)

## Функция `InitializeDrop`
Inputs:
- `InItemId` (`Name`)
- `InCount` (`int`)

Ноды:
1. `Set ItemId = InItemId`
2. `Set Count = InCount`
3. (Опц.) обновить визуал/текст

---

## Итерация 5 — `BPC_LootDrop` (переменные)

1. `OwnerActor` (`Actor`)
2. `LootTable` (`DataTable` ref)
3. `LootRowName` (`Name`) — например `GoblinBasic`
4. `LootDropActorClass` (`Class`, default `BP_LootDropActor`)
5. `DropOffsetZ` (`float`, default `25`)

## Функции
1. `InitializeLootDrop`
2. `RollAndSpawnLoot`
3. `SpawnSingleDrop`

---

## Итерация 6 — `InitializeLootDrop` (node-by-node)

1. `Get Owner` -> `Set OwnerActor`
2. Проверить, что `LootTable` и `LootDropActorClass` заданы

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeLootDrop`

---

## Итерация 7 — `RollAndSpawnLoot` (node-by-node)

## Цель
Пройти по entries строки loot-таблицы и заспавнить выпавшие предметы.

1. `Get Data Table Row` (`LootTable`, `LootRowName`)
2. `Break` row в массив `LootEntries`
3. `ForEachLoop` по `LootEntries`
4. Для каждого entry:
   - `Random Float in Range (0..1)`
   - `<= DropChance` -> `Branch`
   - True:
     - `Random Integer in Range (MinCount..MaxCount)` -> `RolledCount`
     - `Branch (RolledCount > 0)`
     - True -> `SpawnSingleDrop(ItemId, RolledCount)`

---

## Итерация 8 — `SpawnSingleDrop` (node-by-node)

Inputs:
- `InItemId` (`Name`)
- `InCount` (`int`)

1. `IsValid(OwnerActor)` -> Branch
2. `GetActorLocation(OwnerActor)`
3. `Vector + Vector` (добавь Z через `DropOffsetZ`)
4. `SpawnActorFromClass` (`LootDropActorClass`, Transform)
5. `Cast To BP_LootDropActor`
6. `Call InitializeDrop(InItemId, InCount)`

---

## Итерация 9 — интеграция с `BP_EnemyBase`

1. Add Component -> `BPC_LootDrop`
2. Проставь `LootTable` и `LootRowName` для конкретного врага.
3. На событии смерти (`BPC_Health.OnDeath`):
   - `Call BPC_LootDrop.RollAndSpawnLoot`

Важно:
- Вызывать дроп один раз на смерть.
- После респавна дроп не спавнить до новой смерти.

---

## Итерация 10 — финальный smoke test

1. Убиваем NPC -> рядом появляется 1+ `BP_LootDropActor`.
2. Количество и тип предметов соответствуют roll из таблицы.
3. Если шанс не прошел — предмет не падает.
4. При повторной смерти снова происходит roll.
5. Нет compile errors в:
   - `BPC_LootDrop`
   - `BP_LootDropActor`
   - `DT_LootTable_Basic`

Если все пункты true — Phase 7 закрыта.
