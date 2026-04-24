# 01. Phase 12 — status effects и combat event pipeline (подробно по нодам)

Фаза 12 начинается после закрытой Phase 11 (ability-система и cooldown уже работают).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_StatusEffects`
- `Content/_Core/Data/Enums/E_StatusEffectType`
- `Content/_Core/Data/Structs/S_StatusEffectSpec`
- `Content/_Core/Data/Structs/S_StatusEffectRuntime`
- `Content/_Core/Data/DT/DT_StatusEffectsCatalog`
- `Content/_Core/UI/WBP_StatusBar_Min`

Обнови:
- `BPC_AbilitySystem`
- `BPC_Health` / `BPC_AttributeSet`
- `BP_PlayerCharacter` и базовый NPC character

---

## Итерация 2 — модель данных

## `E_StatusEffectType`
Минимальные типы:
1. `DamageOverTime`
2. `HealOverTime`
3. `Stun`
4. `Slow`

## `S_StatusEffectSpec`
Поля:
1. `EffectId` (`Name`)
2. `EffectType` (`E_StatusEffectType`)
3. `DurationSec` (`float`)
4. `TickIntervalSec` (`float`)
5. `Magnitude` (`float`)
6. `MaxStacks` (`int`)
7. `bRefreshDurationOnReapply` (`bool`)
8. `Priority` (`int`)

## `S_StatusEffectRuntime`
Поля:
1. `EffectId` (`Name`)
2. `SourceActor` (`Actor`)
3. `TargetActor` (`Actor`)
4. `StartTime` (`float`)
5. `EndTime` (`float`)
6. `NextTickTime` (`float`)
7. `CurrentStacks` (`int`)

---

## Итерация 3 — каталог эффектов

Создай `DT_StatusEffectsCatalog`.

Минимальные колонки:
1. `EffectId`
2. `EffectType`
3. `DurationSec`
4. `TickIntervalSec`
5. `Magnitude`
6. `MaxStacks`
7. `bRefreshDurationOnReapply`
8. `Priority`

Правило:
- Любой status effect, который накладывают способности/NPC, должен иметь запись в DataTable.

---

## Итерация 4 — скелет `BPC_StatusEffects`

## Переменные
1. `OwnerActor` (`Actor`)
2. `ActiveEffects` (`Array<S_StatusEffectRuntime>`)
3. `StatusCatalogDT` (`DataTable` ref)
4. `OwnerHealth` (ref)
5. `OwnerAttributes` (ref)
6. `UpdateIntervalSec` (`float`, default `0.1`)

## Dispatchers
- `OnStatusApplied(EffectId Name, Stacks int)`
- `OnStatusRemoved(EffectId Name)`
- `OnStatusTick(EffectId Name, Value float)`

## Функции
1. `InitializeStatusSystem`
2. `ApplyStatusEffect(EffectId Name, SourceActor Actor)` -> `bool`
3. `RemoveStatusEffect(EffectId Name)` -> `bool`
4. `ProcessStatusEffects`
5. `ExecuteStatusTick(Runtime S_StatusEffectRuntime)`
6. `FindActiveEffectIndex(EffectId Name)` -> `int`
7. `CanApplyStatus(EffectId Name)` -> `bool`

---

## Итерация 5 — `InitializeStatusSystem` (node-by-node)

1. Event `BeginPlay`
2. `Get Owner` -> `Set OwnerActor`
3. Кэш ссылок на `OwnerHealth` и `OwnerAttributes`
4. Очистка `ActiveEffects`
5. `Set Timer by Function Name`
   - Function Name = `ProcessStatusEffects`
   - Time = `UpdateIntervalSec`
   - Looping = `true`

Важно:
- Используем таймер, а не `Tick` на каждый кадр.

---

## Итерация 6 — `ApplyStatusEffect` (node-by-node)

1. Проверить `CanApplyStatus(EffectId)`
2. Получить spec из `DT_StatusEffectsCatalog`
3. `FindActiveEffectIndex(EffectId)`
4. Если эффект уже активен:
   - если `CurrentStacks < MaxStacks` -> увеличить stacks
   - если `bRefreshDurationOnReapply` -> обновить `EndTime`
   - `OnStatusApplied(EffectId, CurrentStacks)`
   - return true
5. Если эффекта нет:
   - создать новый runtime (`StartTime`, `EndTime`, `NextTickTime`)
   - добавить в `ActiveEffects`
   - `OnStatusApplied(EffectId, 1)`
   - return true

---

## Итерация 7 — `ProcessStatusEffects` (node-by-node)

1. `Now = GetGameTimeInSeconds`
2. For-loop по `ActiveEffects` (лучше в обратном порядке)
3. Для каждого runtime:
   - если `Now >= EndTime` -> удалить эффект + `OnStatusRemoved`
   - иначе если `Now >= NextTickTime`:
     - `ExecuteStatusTick(runtime)`
     - `NextTickTime += TickIntervalSec`

Проверка:
- Эффекты корректно тикают и исчезают по времени.

---

## Итерация 8 — `ExecuteStatusTick` (node-by-node)

По `EffectType`:
1. `DamageOverTime`:
   - `Damage = Magnitude * CurrentStacks`
   - применить через `OwnerHealth.ApplyDamage`
   - `OnStatusTick(EffectId, -Damage)`
2. `HealOverTime`:
   - `Heal = Magnitude * CurrentStacks`
   - применить через `OwnerHealth.ApplyHeal`
   - `OnStatusTick(EffectId, +Heal)`
3. `Stun`:
   - выставить флаг `bCanAct = false` в контроле/ability
4. `Slow`:
   - изменить множитель скорости в locomotion/attributes

Важно:
- Для `Stun/Slow` эффект часто «держится» весь duration, а не только в тик-момент.

---

## Итерация 9 — снятие и конфликт эффектов

## `RemoveStatusEffect`
1. Найти индекс по `EffectId`
2. Если найден:
   - выполнить cleanup (снять stun/slow modifiers)
   - удалить из `ActiveEffects`
   - `OnStatusRemoved`
   - return true
3. иначе return false

## Конфликты/приоритет
- Если два эффекта одного класса конфликтуют (например 2 slow):
  - использовать `Priority` (выше приоритет = доминирует)
  - либо выбрать max magnitude (фиксируй правило в документе/таблице)

---

## Итерация 10 — интеграция с ability pipeline

В `BPC_AbilitySystem.ApplyAbilityEffect` добавь:
1. Для ability, которая накладывает эффект:
   - получить `Target.StatusEffectsComponent`
   - `ApplyStatusEffect(EffectId, SourceActor)`
2. Для dispel ability:
   - `RemoveStatusEffect(EffectId)` или remove-by-type

Требование:
- Наложение эффектов идет через единый компонент `BPC_StatusEffects`, не через разрозненные ветки.

---

## Итерация 11 — UI и combat events

### `WBP_StatusBar_Min`
1. Подписаться на `OnStatusApplied`, `OnStatusRemoved`, `OnStatusTick`
2. Показывать иконки/текст: `EffectId`, stacks, remaining time
3. Обновление remaining time — через легкий таймер `0.1s`

### Combat event pipeline
Введи единый порядок событий:
1. `AbilityCastStarted`
2. `AbilityCommitted`
3. `Damage/HealApplied`
4. `StatusApplied/Removed/Tick`
5. `AbilityCastFinished`

Это упрощает дебаг и журналирование боя.

---

## Итерация 12 — финальный smoke test

1. Способность с DoT накладывает эффект и наносит периодический урон.
2. HoT корректно лечит по тик-таймеру.
3. Повторное наложение обновляет duration/stack по заданным правилам.
4. Stun блокирует активацию способностей на время эффекта.
5. Slow снижает скорость и корректно откатывается при удалении эффекта.
6. По истечении duration эффекты удаляются без «зависших» модификаторов.
7. UI статус-бар отражает примененные эффекты и их состояние.
8. Нет compile errors в:
   - `BPC_StatusEffects`
   - `BPC_AbilitySystem`
   - `WBP_StatusBar_Min`
   - `DT_StatusEffectsCatalog`

Если все пункты true — Phase 12 закрыта.
