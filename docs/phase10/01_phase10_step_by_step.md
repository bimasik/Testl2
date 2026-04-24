# 01. Phase 10 — статы от экипировки + визуал (подробно по нодам)

Фаза 10 начинается после закрытой Phase 9 (экипировка слотов уже работает).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Data/Structs/S_StatBlock`
- `Content/_Core/Data/Structs/S_EquipmentStatBonus`
- `Content/_Core/Data/Structs/S_EquipmentVisual`
- `Content/_Core/Data/DT/DT_ItemEquipmentProfile`

Обнови:
- `BPC_Equipment`
- `BPC_AttributeSet` (или эквивалентный компонент статов)
- `BP_PlayerCharacter`

---

## Итерация 2 — структуры данных

## `S_StatBlock`
Поля (минимум):
1. `AttackPower` (`float`)
2. `Defense` (`float`)
3. `MaxHP` (`float`)
4. `MoveSpeedBonus` (`float`)

## `S_EquipmentStatBonus`
Поля:
1. `ItemId` (`Name`)
2. `Bonus` (`S_StatBlock`)

## `S_EquipmentVisual`
Поля:
1. `ItemId` (`Name`)
2. `Mesh` (`StaticMesh`/`SkeletalMesh`)
3. `AttachSocket` (`Name`)
4. `AttachScale` (`Vector`, default `1,1,1`)

---

## Итерация 3 — `DT_ItemEquipmentProfile`

Создай DataTable на базе структуры профиля (можно объединить бонусы+визуал в одну структуру).

Минимальные колонки:
1. `ItemId`
2. `AttackPower`
3. `Defense`
4. `MaxHP`
5. `MoveSpeedBonus`
6. `Mesh`
7. `AttachSocket`
8. `AttachScale`

Правило:
- Для каждого экипируемого `ItemId` должна быть строка в DataTable.

---

## Итерация 4 — расширение `BPC_Equipment` (переменные)

Добавь в `BPC_Equipment`:
1. `EquipmentProfileDT` (`DataTable` ref)
2. `CachedStatBonus` (`S_StatBlock`)
3. `VisualActorsBySlot` (`Map<E_EquipmentSlot, Actor>`)
4. `OwnerAttributes` (ref на компонент статов)

Добавь функции:
1. `RebuildEquipmentStats`
2. `ApplyStatsToOwner`
3. `RefreshEquipmentVisuals`
4. `AttachVisualForSlot`
5. `ClearVisualForSlot`
6. `GetProfileByItemId(ItemId Name)` -> `Found`, `Profile`

---

## Итерация 5 — инициализация зависимостей (node-by-node)

В `InitializeEquipment` добавь:
1. `Get Component By Class` (`BPC_AttributeSet`) на `OwnerActor`
2. `Set OwnerAttributes`
3. `RebuildEquipmentStats`
4. `RefreshEquipmentVisuals`

Важно:
- Касты выполняем в контролируемой точке (инициализация), не в `Tick`.

---

## Итерация 6 — `GetProfileByItemId` (node-by-node)

Inputs:
- `ItemId`

Outputs:
- `Found`
- `Profile`

1. `IsValid(EquipmentProfileDT)` -> Branch
2. `Get Data Table Row` (`RowName = ItemId`)
3. Если row найден -> `Found = true`, вернуть `Profile`
4. Иначе -> `Found = false`

---

## Итерация 7 — `RebuildEquipmentStats` (node-by-node)

Цель: пересчитать сумму бонусов от всех экипированных предметов.

1. Обнулить локальный `TotalBonus` (`S_StatBlock` zeros)
2. `ForEachLoop` по `EquippedItems`
3. Для каждого элемента:
   - `GetProfileByItemId(ArrayElement.ItemId)`
   - если `Found`:
     - `TotalBonus.AttackPower += Profile.AttackPower`
     - `TotalBonus.Defense += Profile.Defense`
     - `TotalBonus.MaxHP += Profile.MaxHP`
     - `TotalBonus.MoveSpeedBonus += Profile.MoveSpeedBonus`
4. `Set CachedStatBonus = TotalBonus`
5. `Call ApplyStatsToOwner`

---

## Итерация 8 — `ApplyStatsToOwner` (node-by-node)

1. `IsValid(OwnerAttributes)` -> Branch
2. Передать `CachedStatBonus` в компонент статов:
   - либо через `SetEquipmentBonus(S_StatBlock)`
   - либо через отдельные set-функции
3. В компоненте статов вызвать итоговый `RecalculateFinalStats`

Принцип:
- Все итоговые stat-формулы централизованы в одном месте (компонент статов),
  `BPC_Equipment` только дает equipment-bonus.

---

## Итерация 9 — `RefreshEquipmentVisuals` (node-by-node)

1. Пройти по всем слотам `E_EquipmentSlot`:
   - `ClearVisualForSlot(Slot)`
2. `ForEachLoop` по `EquippedItems`:
   - `AttachVisualForSlot(ArrayElement.Slot, ArrayElement.ItemId)`

Когда вызывать:
- после `EquipItem` success
- после `UnequipItem` success
- при `BeginPlay` (после восстановления состояния)

---

## Итерация 10 — `AttachVisualForSlot` и `ClearVisualForSlot`

## `ClearVisualForSlot(Slot)`
1. Проверить `VisualActorsBySlot` содержит `Slot`
2. Если да:
   - взять Actor
   - `DestroyActor`
   - удалить ключ из `VisualActorsBySlot`

## `AttachVisualForSlot(Slot, ItemId)`
1. `GetProfileByItemId(ItemId)` -> Branch
2. Проверить `Profile.Mesh` валиден
3. `SpawnActor` (временный `BP_EquipmentVisualActor`)
4. `AttachActorToComponent` (к mesh игрока, socket = `Profile.AttachSocket`)
5. `SetActorScale3D(Profile.AttachScale)`
6. Сохранить actor в `VisualActorsBySlot[Slot]`

Ограничение этой фазы:
- Достаточно простого spawn+attach без сложных анимационных overrides.

---

## Итерация 11 — интеграционные точки

После успешного `EquipItem`:
1. `RebuildEquipmentStats`
2. `RefreshEquipmentVisuals`
3. `OnEquipmentChanged`

После успешного `UnequipItem`:
1. `RebuildEquipmentStats`
2. `RefreshEquipmentVisuals`
3. `OnEquipmentChanged`

Проверка порядка:
- сначала состояние данных,
- потом пересчет,
- потом визуал,
- затем UI/event.

---

## Итерация 12 — финальный smoke test

1. Экипируем `Sword_01` -> растет `AttackPower`.
2. Экипируем `Armor_01` -> растет `Defense` и/или `MaxHP`.
3. Снимаем предмет -> соответствующие бонусы исчезают.
4. На персонаже появляется/исчезает нужный mesh по сокету.
5. Переэкипировка в занятый слот меняет и статы, и визуал без «висячих» actor.
6. При отсутствии row в DataTable система не падает (пропускает предмет и логирует warning).
7. Нет compile errors в:
   - `BPC_Equipment`
   - `BPC_AttributeSet` (или аналог)
   - `BP_PlayerCharacter`
   - `DT_ItemEquipmentProfile`

Если все пункты true — Phase 10 закрыта.
