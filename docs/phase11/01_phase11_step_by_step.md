# 01. Phase 11 — активные способности и combat modifiers (подробно по нодам)

Фаза 11 начинается после закрытой Phase 10 (базовые статы/экипировка уже работают).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_AbilitySystem`
- `Content/_Core/Data/Structs/S_AbilitySpec`
- `Content/_Core/Data/Structs/S_AbilityRuntimeState`
- `Content/_Core/Data/DT/DT_AbilityCatalog`
- `Content/_Core/UI/WBP_AbilityBar_Min`

Обнови:
- `BP_PlayerCharacter`
- компонент ресурсов/статов (mana/stamina/hp)

---

## Итерация 2 — структура способности

## `S_AbilitySpec`
Поля (минимум):
1. `AbilityId` (`Name`)
2. `DisplayName` (`Text`)
3. `InputTag` (`Name`) — например `Ability.Slot1`
4. `CooldownSec` (`float`)
5. `ResourceType` (`Name`) — `Mana`/`Stamina`
6. `ResourceCost` (`float`)
7. `BasePower` (`float`)
8. `Range` (`float`)
9. `CastTime` (`float`, default `0`)

## `S_AbilityRuntimeState`
Поля:
1. `AbilityId` (`Name`)
2. `CooldownEndTime` (`float`)
3. `bIsCasting` (`bool`)

---

## Итерация 3 — каталог способностей

Создай `DT_AbilityCatalog`.

Минимальные колонки:
1. `AbilityId`
2. `InputTag`
3. `CooldownSec`
4. `ResourceType`
5. `ResourceCost`
6. `BasePower`
7. `Range`
8. `CastTime`

Правило:
- Каждая ability, которую можно выдать игроку, должна иметь валидную запись в DataTable.

---

## Итерация 4 — скелет `BPC_AbilitySystem`

## Переменные
1. `OwnerActor` (`Actor`)
2. `KnownAbilities` (`Array<S_AbilitySpec>`)
3. `RuntimeStates` (`Map<Name, S_AbilityRuntimeState>`) // key = AbilityId
4. `OwnerStats` (ref на stats/resource компонент)
5. `AbilityCatalogDT` (`DataTable` ref)

## Dispatchers
- `OnAbilityCastStarted(AbilityId Name)`
- `OnAbilityCastFinished(AbilityId Name, bSuccess bool)`
- `OnAbilityCooldownChanged(AbilityId Name, Remaining float)`

## Функции
1. `InitializeAbilitySystem`
2. `GrantAbility(AbilityId Name)` -> `bool`
3. `TryActivateAbility(AbilityId Name)` -> `bool`
4. `CanActivateAbility(AbilityId Name)` -> `bool`
5. `CommitAbilityCost(AbilityId Name)` -> `bool`
6. `ApplyAbilityEffect(AbilityId Name, Target Actor)`
7. `StartCooldown(AbilityId Name)`
8. `GetCooldownRemaining(AbilityId Name)` -> `float`

---

## Итерация 5 — `InitializeAbilitySystem` (node-by-node)

1. Event `BeginPlay`
2. `Get Owner` -> `Set OwnerActor`
3. `Get Component By Class` (stats/resource component) -> `Set OwnerStats`
4. Инициализировать `RuntimeStates` пустыми значениями
5. Выдать стартовые способности через `GrantAbility`

Важно:
- Кэшируем ссылки один раз. Без постоянных cast в input-событиях.

---

## Итерация 6 — `GrantAbility` (node-by-node)

Inputs:
- `AbilityId`

Output:
- `bool`

1. Проверить, что ability еще не в `KnownAbilities`
2. Получить row из `DT_AbilityCatalog`
3. Если row не найден -> return false
4. Добавить `S_AbilitySpec` в `KnownAbilities`
5. Создать/обновить запись `RuntimeStates[AbilityId]`
6. Return true

---

## Итерация 7 — `CanActivateAbility` (node-by-node)

1. Найти ability в `KnownAbilities` (иначе false)
2. Проверить, что не идет каст (`bIsCasting == false`)
3. Проверить cooldown: `GetCooldownRemaining <= 0`
4. Проверить ресурс: `OwnerStats.CurrentResource >= ResourceCost`
5. Проверить дистанцию/валидность цели (если ability target-based)
6. Return true только если все условия true

---

## Итерация 8 — `TryActivateAbility` (node-by-node)

1. `CanActivateAbility(AbilityId)` -> Branch
2. false -> `OnAbilityCastFinished(AbilityId, false)` + return false
3. true:
   - `OnAbilityCastStarted(AbilityId)`
   - если `CastTime > 0`: запуск таймера каста
   - иначе сразу commit
4. `CommitAbilityCost(AbilityId)` -> Branch
5. при успехе:
   - `ApplyAbilityEffect(AbilityId, CurrentTarget)`
   - `StartCooldown(AbilityId)`
   - `OnAbilityCastFinished(AbilityId, true)`
6. при провале:
   - `OnAbilityCastFinished(AbilityId, false)`
7. return success

---

## Итерация 9 — `CommitAbilityCost` и `StartCooldown`

## `CommitAbilityCost`
1. Получить spec по `AbilityId`
2. Проверить ресурс повторно (защита от race conditions)
3. Списать ресурс через stats component
4. Вернуть true/false

## `StartCooldown`
1. `Now = GetGameTimeInSeconds`
2. `CooldownEndTime = Now + Spec.CooldownSec`
3. Записать в `RuntimeStates[AbilityId]`
4. Опционально: таймер обновления UI раз в `0.1s`

---

## Итерация 10 — `ApplyAbilityEffect`

Минимальная версия этой фазы:
1. Если offensive ability:
   - вычислить `FinalPower = BasePower * (1 + AttackPowerScale)`
   - вызвать у цели `ApplyDamage/ReceiveHit`
2. Если support ability:
   - восстановить ресурс/HP

Правило:
- Формулы и модификаторы централизуем (не дублируем математику в UI).

---

## Итерация 11 — интеграция input и UI

### Input
1. Добавить IA на слоты (`IA_AbilitySlot1`, `IA_AbilitySlot2` ...)
2. В `BP_PlayerCharacter` пробрасывать в `BPC_AbilitySystem.TryActivateAbility`.

### UI `WBP_AbilityBar_Min`
1. Подписаться на dispatchers ability-системы
2. Показать:
   - доступность ability
   - кулдаун (remaining)
   - нехватку ресурса (disabled state)

Требование:
- UI обновляется событиями/таймером, не через тяжелый `Tick` с кастами.

---

## Итерация 12 — финальный smoke test

1. Игрок имеет минимум 2 способности в `KnownAbilities`.
2. Нажатие на слот запускает `TryActivateAbility`.
3. При нехватке ресурса ability не активируется.
4. При успешной активации ресурс списывается ровно один раз.
5. Эффект способности применяется к цели/игроку корректно.
6. Кулдаун блокирует повторное использование до завершения.
7. UI корректно показывает cooldown/disabled state.
8. Нет compile errors в:
   - `BPC_AbilitySystem`
   - `BP_PlayerCharacter`
   - `WBP_AbilityBar_Min`
   - `DT_AbilityCatalog`

Если все пункты true — Phase 11 закрыта.
