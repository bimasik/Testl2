# 01. Phase 2 — локомоция (подробно по нодам)

Фаза 2 начинается после полностью закрытой Phase 1.

---

## Итерация 1 — ассеты и входные данные

## Создай ассеты
- `Content/_Core/Blueprints/Components/BPC_Locomotion`
- `Content/_Core/Input/IA_ToggleWalk`
- `Content/_Core/Input/IMC_PlayerBase` (обновляем, не создаем новый)

## Настрой `IA_ToggleWalk`
- Value Type: `Digital (bool)`
- Trigger: `Pressed`
- Клавиша: `CapsLock` (или `NumLock`, если Caps неудобен)

## Обнови `IMC_PlayerBase`
Добавь mapping:
- `IA_ToggleWalk` -> `CapsLock`

## Проверка итерации
- Новый IA виден в IMC и компилируется.

---

## Итерация 2 — скелет `BPC_Locomotion`

## Добавь переменные в `BPC_Locomotion`
1. `OwnerCharacter` (`Character` ref)
2. `OwnerMovement` (`CharacterMovementComponent` ref)
3. `WalkSpeed` (`float`, default `220`)
4. `RunSpeed` (`float`, default `450`)
5. `CurrentSpeed` (`float`, default `0`)
6. `bWalkMode` (`bool`, default `false`)  
   - false = run mode (по умолчанию)
7. `bIsMoving` (`bool`, default `false`)
8. `MoveThreshold` (`float`, default `5.0`)
9. `RotationRateRun` (`float`, default `540`)
10. `RotationRateWalk` (`float`, default `360`)

## Добавь функции
1. `InitializeReferences`
2. `ApplyMoveMode`
3. `ToggleWalkMode`
4. `UpdateLocomotionState`

---

## Итерация 3 — `InitializeReferences` (node-by-node)

## Цель
Закешировать ссылки один раз (без повторных Cast в событиях).

## Ноды
1. `Get Owner`
2. `Cast To Character`
3. `Set OwnerCharacter`
4. `Get Character Movement` (из `OwnerCharacter`)
5. `Set OwnerMovement`
6. `Call ApplyMoveMode`

## BeginPlay компонента
1. Event `BeginPlay`
2. Вызвать `InitializeReferences`

## Проверка итерации
- В Watch видно валидные `OwnerCharacter` и `OwnerMovement`.

---

## Итерация 4 — `ApplyMoveMode` (node-by-node)

## Логика
- Если `bWalkMode = true` -> WalkSpeed + RotationRateWalk
- Иначе -> RunSpeed + RotationRateRun

## Ноды
1. `IsValid` (`OwnerMovement`) -> `Branch`
2. `Branch` (`bWalkMode`)

### True (Walk)
3. `Set Max Walk Speed` (Target `OwnerMovement`, Value `WalkSpeed`)
4. `Make Rotator` (Yaw = `RotationRateWalk`)
5. `Set Rotation Rate` (Target `OwnerMovement`)

### False (Run)
6. `Set Max Walk Speed` (Value `RunSpeed`)
7. `Make Rotator` (Yaw = `RotationRateRun`)
8. `Set Rotation Rate`

---

## Итерация 5 — `ToggleWalkMode` (node-by-node)

## Ноды
1. `NOT` (`bWalkMode`)
2. `Set bWalkMode`
3. `Call ApplyMoveMode`

## Проверка итерации
- При вызове функции скорость меняется между walk/run.

---

## Итерация 6 — `UpdateLocomotionState` (node-by-node)

## Цель
Обновлять `CurrentSpeed` и `bIsMoving` для анимации/UI.

## Ноды
1. `IsValid` (`OwnerCharacter`) -> `Branch`
2. `Get Velocity` (из `OwnerCharacter`)
3. `Vector Length XY`
4. `Set CurrentSpeed`
5. `>` (`CurrentSpeed`, `MoveThreshold`)
6. `Set bIsMoving`

## Вызов
- Пока в этой фазе можно вызывать из `Tick` компонента (допустимо для прототипа).

### Event Tick компонента
1. Event `TickComponent`
2. `Call UpdateLocomotionState`

---

## Итерация 7 — подключение `BPC_Locomotion` в `BP_PlayerCharacter`

## Шаги
1. Открой `BP_PlayerCharacter`.
2. Add Component -> `BPC_Locomotion`.
3. В Event Graph добавь обработку `IA_ToggleWalk`.

## Ноды для `IA_ToggleWalk (Started)`
1. Event `IA_ToggleWalk` (Started)
2. `Get BPC_Locomotion`
3. `Call ToggleWalkMode`

## Проверка итерации
- CapsLock переключает режим walk/run.

---

## Итерация 8 — связка с AnimBP (минимум)

## Цель
Передавать speed в анимацию без сложных state machine расширений.

## В AnimBP (Event Blueprint Update Animation)
1. `Try Get Pawn Owner`
2. `Cast To BP_PlayerCharacter`
3. `Get BPC_Locomotion`
4. `Read CurrentSpeed`
5. `Set Speed` (AnimBP variable)

Опционально:
6. `Read bIsMoving`
7. `Set IsMoving`

## Проверка
- BlendSpace реагирует на `Speed`.

---

## Итерация 9 — финальный smoke test

1. ЛКМ по земле -> персонаж идет/бежит как в Phase 1.
2. CapsLock переключает walk/run.
3. В run скорость выше, чем в walk.
4. При зажатой ПКМ камера вращается (логика Phase 1 не сломана).
5. В AnimBP `Speed` обновляется.
6. Нет compile errors в:
   - `BPC_Locomotion`
   - `BP_PlayerCharacter`
   - `IMC_PlayerBase`
   - `IA_ToggleWalk`

Если все пункты true — Phase 2 закрыта.
