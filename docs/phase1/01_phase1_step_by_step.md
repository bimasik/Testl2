# 01. Phase 1 — пошагово и по нодам (для джуна)

Документ разбит на итерации. Не переходи к следующей, пока текущая не работает.

---

## Итерация 1 — Каркас ассетов

## Цель
Подготовить все ассеты, чтобы дальше только связывать логику.

L2-правила для этой фазы берём из `03_l2_mechanics_requirements.md`.

## Создай ассеты
- `Content/_Core/Blueprints/Characters/BP_CharacterBase`
- `Content/_Core/Blueprints/Characters/BP_PlayerCharacter` (Child of `BP_CharacterBase`)
- `Content/_Core/Blueprints/Controllers/BP_PlayerController`
- `Content/_Core/Blueprints/Components/BPC_PlayerControl`
- `Content/_Core/Input/IA_ClickMove`
- `Content/_Core/Input/IA_Look`
- `Content/_Core/Input/IA_CameraRotateHold`
- `Content/_Core/Input/IA_Jump`
- `Content/_Core/Input/IMC_PlayerBase`
- `Content/_Core/Blueprints/GameModes/BP_GameMode_Base`
- `Content/_Core/Maps/L_Phase1_PlayerBootstrap`

## Проверка итерации
- Все ассеты созданы и компилируются.

---

## Итерация 2 — `BP_CharacterBase` (камера и базовые настройки)

## Шаг 2.1 Компоненты
В `BP_CharacterBase`:
1. Открой Components.
2. Убедись, что есть `Capsule` и `Mesh` (по умолчанию).
3. Add Component -> `SpringArm`, имя: `CameraBoom`.
4. Add Component -> `Camera`, имя: `FollowCamera`.
5. Прикрепи `FollowCamera` к `CameraBoom`.

## Шаг 2.2 Настройки CameraBoom
- Target Arm Length: `350`
- Use Pawn Control Rotation: `true`

## Шаг 2.3 Настройки Character
- Use Controller Rotation Yaw: `false`
- CharacterMovement -> Orient Rotation to Movement: `true`
- CharacterMovement -> Rotation Rate Z: `540`

## Проверка итерации
- При запуске камера не внутри меша и вращается как third-person.

---

## Итерация 3 — Enhanced Input ассеты

## Шаг 3.1 `IA_ClickMove`
- Value Type: `Digital (bool)`
- Trigger: `Pressed`

## Шаг 3.2 `IA_Look`
- Value Type: `Axis2D`
- Triggers: пусто

## Шаг 3.3 `IA_Jump`
- Value Type: `Digital (bool)`
- Trigger: `Pressed`

## Шаг 3.4 `IA_CameraRotateHold`
- Value Type: `Digital (bool)`
- Triggers: `Pressed` + `Released`

## Шаг 3.5 `IMC_PlayerBase`
Добавь маппинги:
- `IA_ClickMove` -> Left Mouse Button
- `IA_Look` -> Mouse X, Mouse Y
- `IA_CameraRotateHold` -> Right Mouse Button
- `IA_Jump` -> Space Bar

## Проверка итерации
- Все IA добавлены в IMC без конфликтов.

---

## Итерация 4 — `BPC_PlayerControl` (ядро ввода)

## Цель
Вынести управление из Character в отдельный компонент.

## Шаг 4.1 Функции компонента
В `BPC_PlayerControl` создай функции:
1. `InitializeReferences` (без входов)
2. `HandleClickMove` (без входов)
3. `HandleLook` (Input: `LookAxis` Vector2D)
4. `SetCameraRotateHeld` (Input: `bHeld` bool)
5. `HandleJumpPressed` (без входов)
6. `HandleJumpReleased` (без входов, опционально)

Создай переменные компонента:
- `OwnerCharacter` (type: `Character` ref)
- `OwnerPlayerController` (type: `PlayerController` ref)
- `bCameraRotateHeld` (bool, default false)

> Правило: Cast делаем один раз в `InitializeReferences`, затем используем кэшированные ссылки.

## Шаг 4.2 Ноды для `InitializeReferences` (Node-by-node)
1. `Get Owner`
2. `Cast To Character` *(оправданный единичный Cast)*.
3. `Set OwnerCharacter`.
4. `Get Controller` (из `OwnerCharacter`).
5. `Cast To PlayerController` *(оправданный единичный Cast для cursor API)*.
6. `Set OwnerPlayerController`.

## Шаг 4.3 Ноды для `HandleClickMove` (Node-by-node)
1. `IsValid` (`OwnerPlayerController`) -> `Branch`
2. `Get Hit Result Under Cursor by Channel` (Target = `OwnerPlayerController`, Visibility)
3. `Break Hit Result`
4. `Branch` (Blocking Hit)
5. `Simple Move to Location`
   - Controller = `OwnerPlayerController`
   - Goal = Impact Point (из Hit Result)

> Важно: в Phase 1 эта функция обрабатывает только клик по земле.  
> Клик по NPC/объекту (таргет + повторный клик для действия) будет добавлен в фазах таргетинга/интеракции.

## Шаг 4.4 Ноды для `HandleLook`
1. `IsValid` (`OwnerPlayerController`) -> `Branch`
2. `Branch` (`bCameraRotateHeld`)
3. *(True)* `Break Vector2D` (LookAxis)
4. *(True)* `Add Yaw Input` (Target = `OwnerPlayerController`, Value = X)
5. *(True)* `Add Pitch Input` (Target = `OwnerPlayerController`, Value = Y)
6. *(False)* ничего не делать (камера не вращается)

## Шаг 4.5 Ноды для `SetCameraRotateHeld`
1. `Set bCameraRotateHeld = bHeld`

## Шаг 4.6 Ноды для `HandleJumpPressed`
1. `IsValid` (`OwnerCharacter`) -> `Branch`
2. `Jump` (Target = `OwnerCharacter`)

## Шаг 4.7 Ноды для `HandleJumpReleased` (если нужен)
1. `IsValid` (`OwnerCharacter`) -> `Branch`
2. `Stop Jumping` (Target = `OwnerCharacter`)

## Проверка итерации
- Функции компилируются, ошибок Cast нет.

---

## Итерация 5 — Подключение компонента в `BP_PlayerCharacter`

## Шаг 5.1 Добавь компонент
- Открой `BP_PlayerCharacter`.
- Add Component -> `BPC_PlayerControl`.

## Шаг 5.2 Input events в Event Graph (Node-by-node)

До обработки input на `BeginPlay`:
1. `Get BPC_PlayerControl`
2. Вызвать `InitializeReferences`

### `IA_ClickMove (Started)`
1. Event `IA_ClickMove` (Started)
2. `Get BPC_PlayerControl`
3. Вызвать `HandleClickMove`

### `IA_Look (Triggered)`
1. Event `IA_Look`
2. Взять `Value`
3. `Get BPC_PlayerControl`
4. Вызвать `HandleLook(Value as Vector2D)`

### `IA_CameraRotateHold (Started)`
1. Event `IA_CameraRotateHold` (Started)
2. `Get BPC_PlayerControl`
3. Вызвать `SetCameraRotateHeld(true)`

### `IA_CameraRotateHold (Completed)`
1. Event `IA_CameraRotateHold` (Completed)
2. `Get BPC_PlayerControl`
3. Вызвать `SetCameraRotateHeld(false)`

### `IA_Jump (Started)`
1. Event `IA_Jump` (Started)
2. `Get BPC_PlayerControl`
3. Вызвать `HandleJumpPressed`

### `IA_Jump (Completed)` (опционально)
1. Event `IA_Jump` (Completed)
2. `Get BPC_PlayerControl`
3. Вызвать `HandleJumpReleased`

## Проверка итерации
- В `BP_PlayerCharacter` нет прямого вызова `Add Movement Input`/`Jump`; всё идет через компонент.

---

## Итерация 6 — `BP_PlayerController` и Mapping Context

## Шаг 6.1 Node-by-node для BeginPlay
1. Event `BeginPlay`
2. `Get Local Player`
3. `Get Subsystem (Enhanced Input Local Player Subsystem)`
4. `Add Mapping Context`
   - Mapping Context = `IMC_PlayerBase`
   - Priority = `0`

## Проверка итерации
- В PIE контроллер добавляет IMC без ошибок.

---

## Итерация 7 — GameMode и карта

## Шаг 7.1 `BP_GameMode_Base`
- Default Pawn Class = `BP_PlayerCharacter`
- Player Controller Class = `BP_PlayerController`

## Шаг 7.2 Карта
- Создай `L_Phase1_PlayerBootstrap`.
- В World Settings укажи GameMode Override = `BP_GameMode_Base`.

## Проверка итерации
- На Play спавнится `BP_PlayerCharacter` под `BP_PlayerController`.

---

## Итерация 8 — Финальный smoke test

Прогон:
1. ЛКМ по земле: персонаж бежит в точку клика.
2. Без зажатой ПКМ камера не вращается.
3. При зажатой ПКМ камера вращается мышью.
4. Space: прыжок работает.
5. Нет compile errors в `BP_CharacterBase`, `BP_PlayerCharacter`, `BP_PlayerController`, `BPC_PlayerControl`.
6. Input логика находится в `BPC_PlayerControl`.

Если все пункты true — Phase 1 закрыта.
