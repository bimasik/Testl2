# 01. Phase 3 — таргетинг (подробно по нодам)

Фаза 3 начинается после закрытой Phase 2.

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_Targeting`
- `Content/_Core/Blueprints/Interfaces/BPI_Targetable`
- `Content/_Core/Input/IA_TargetClick`
- `Content/_Core/Input/IA_ClearTarget`
- `Content/_Core/UI/WBP_TargetFrame_Min` (минимальный UI таргета)

Обнови:
- `IMC_PlayerBase`

---

## Итерация 2 — интерфейс `BPI_Targetable`

Добавь функции:
1. `CanBeTargeted` -> `bool`
2. `GetTargetDisplayName` -> `Text`
3. `GetTargetWorldLocation` -> `Vector`
4. `GetTargetTypeTag` -> `GameplayTag` (опционально)

> На этой фазе достаточно `CanBeTargeted` и `GetTargetDisplayName`.

---

## Итерация 3 — input actions для таргета

## `IA_TargetClick`
- Value Type: `Digital`
- Trigger: `Pressed`
- Mapping: `Left Mouse Button`

## `IA_ClearTarget`
- Value Type: `Digital`
- Trigger: `Pressed`
- Mapping: `Esc`

Добавь оба в `IMC_PlayerBase`.

---

## Итерация 4 — `BPC_Targeting` (переменные и функции)

## Переменные
1. `OwnerCharacter` (`Character` ref)
2. `OwnerPlayerController` (`PlayerController` ref)
3. `CurrentTarget` (`Actor` ref)
4. `bHasTarget` (`bool`)
5. `TargetingChannel` (`TraceTypeQuery`, default Visibility)

## Dispatcher
- `OnTargetChanged(NewTarget Actor)`

## Функции
1. `InitializeReferences`
2. `TrySelectTargetUnderCursor`
3. `SetTarget` (Input: `NewTarget Actor`)
4. `ClearTarget`
5. `ValidateCurrentTarget`

---

## Итерация 5 — `InitializeReferences` (node-by-node)

1. `Get Owner`
2. `Cast To Character`
3. `Set OwnerCharacter`
4. `Get Controller` (из OwnerCharacter)
5. `Cast To PlayerController`
6. `Set OwnerPlayerController`

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeReferences`

---

## Итерация 6 — `TrySelectTargetUnderCursor` (node-by-node)

1. `IsValid` (`OwnerPlayerController`) -> `Branch`
2. `Get Hit Result Under Cursor by Channel` (Target = OwnerPlayerController, Visibility)
3. `Break Hit Result`
4. `Branch` (`Blocking Hit`)
5. `Hit Actor` -> `IsValid` -> `Branch`
6. `Does Implement Interface` (`BPI_Targetable`) -> `Branch`
7. `CanBeTargeted` (Message) -> `Branch`
8. True -> `SetTarget(Hit Actor)`
9. False -> ничего (не сбрасываем текущую цель автоматически)

---

## Итерация 7 — `SetTarget` (node-by-node)

1. `IsValid(NewTarget)` -> `Branch`
2. `Set CurrentTarget = NewTarget`
3. `Set bHasTarget = true`
4. `Call OnTargetChanged(CurrentTarget)`

---

## Итерация 8 — `ClearTarget` (node-by-node)

1. `Set CurrentTarget = None`
2. `Set bHasTarget = false`
3. `Call OnTargetChanged(None)`

---

## Итерация 9 — `ValidateCurrentTarget` (node-by-node)

1. `IsValid(CurrentTarget)` -> `Branch`
2. False -> `ClearTarget`
3. True -> `Does Implement Interface (BPI_Targetable)` -> `Branch`
4. True -> `CanBeTargeted` (Message) -> `Branch`
5. False -> `ClearTarget`

Вызов:
- можно вызывать раз в 0.2–0.5 сек таймером (не каждый Tick).

---

## Итерация 10 — подключение в `BP_PlayerCharacter`

1. Добавь компонент `BPC_Targeting`.

### Событие `IA_TargetClick (Started)`
1. Event `IA_TargetClick`
2. `Get BPC_Targeting`
3. `Call TrySelectTargetUnderCursor`

### Событие `IA_ClearTarget (Started)`
1. Event `IA_ClearTarget`
2. `Get BPC_Targeting`
3. `Call ClearTarget`

---

## Итерация 11 — минимальный UI цели

## `WBP_TargetFrame_Min`
Элементы:
- `TargetNameText`
- `Root` (для Show/Hide)

## Логика
- На `OnTargetChanged`:
  - если None -> Hide
  - иначе:
    - `GetTargetDisplayName` (Message)
    - `SetText(TargetNameText)`
    - Show

---

## Итерация 12 — L2-правило клика (в рамках Phase 3)

На этой фазе реализуем только:
- 1-й клик по NPC/объекту = таргет.

Не реализуем пока:
- 2-й клик = подбежать + выполнить действие.

Это переносится в фазу интеракции/боевой фазы, чтобы не смешивать ответственности.

При этом приоритет клика уже фиксируем как в `docs/system/interaction_l2.md`:
1. loot click
2. target click
3. ground click

---

## Итерация 13 — финальный smoke test

1. ЛКМ по таргетируемому NPC/объекту -> цель выделяется.
2. `WBP_TargetFrame_Min` показывает имя цели.
3. `Esc` сбрасывает цель.
4. При невалидной цели `ValidateCurrentTarget` очищает таргет.
5. Нет compile errors в:
   - `BPC_Targeting`
   - `BPI_Targetable`
   - `BP_PlayerCharacter`
   - `WBP_TargetFrame_Min`

Если все пункты true — Phase 3 закрыта.
