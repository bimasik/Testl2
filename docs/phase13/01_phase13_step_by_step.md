# 01. Phase 13 — AI behavior layers (threat + utility) (подробно по нодам)

Фаза 13 начинается после закрытой Phase 12 (abilities + status effects уже работают).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_AIThreat`
- `Content/_Core/Blueprints/Components/BPC_AIUtility`
- `Content/_Core/Data/Structs/S_ThreatEntry`
- `Content/_Core/Data/Structs/S_UtilityAction`
- `Content/_Core/Data/DT/DT_AIUtilityProfiles`

Обнови:
- `BPC_NPCAICombat`
- `BP_NPCCharacter_Base`
- (опционально) `WBP_AIDebug_Min`

---

## Итерация 2 — модель threat

## `S_ThreatEntry`
Поля:
1. `TargetActor` (`Actor`)
2. `ThreatValue` (`float`)
3. `LastUpdateTime` (`float`)
4. `RecentDamageTaken` (`float`)
5. `DistanceWeight` (`float`)

## Переменные `BPC_AIThreat`
1. `ThreatTable` (`Array<S_ThreatEntry>`)
2. `ThreatDecayPerSec` (`float`, default `2.0`)
3. `ThreatUpdateInterval` (`float`, default `0.2`)
4. `CurrentFocusTarget` (`Actor`)

Функции:
- `AddThreat(Target, Delta)`
- `DecayThreatOverTime`
- `GetTopThreatTarget` -> `Actor`
- `ClearInvalidThreatEntries`

---

## Итерация 3 — модель utility

## `S_UtilityAction`
Поля:
1. `ActionId` (`Name`) // `Attack`, `Chase`, `Retreat`, `UseAbility`, `Idle`
2. `BaseScore` (`float`)
3. `CooldownSec` (`float`)
4. `MinRange` (`float`)
5. `MaxRange` (`float`)
6. `MinHPPercent` (`float`)
7. `MaxHPPercent` (`float`)
8. `RequiredStatusTag` (`Name`, optional)
9. `BlockedByStatusTag` (`Name`, optional)

## `DT_AIUtilityProfiles`
- профиль utility-экшенов на archetype NPC.

---

## Итерация 4 — скелет `BPC_AIUtility`

## Переменные
1. `OwnerNPC` (`Character`)
2. `ThreatComponent` (`BPC_AIThreat` ref)
3. `StatusComponent` (`BPC_StatusEffects` ref)
4. `HealthComponent` (`BPC_Health`/attributes ref)
5. `UtilityProfileDT` (`DataTable` ref)
6. `DecisionIntervalSec` (`float`, default `0.25`)
7. `LastActionTimeById` (`Map<Name, float>`)
8. `CurrentActionId` (`Name`)

## Dispatchers
- `OnAIActionSelected(ActionId Name, Target Actor, Score float)`

## Функции
1. `InitializeUtility`
2. `EvaluateAndSelectAction`
3. `ScoreAction(Action S_UtilityAction, Target Actor)` -> `float`
4. `CanRunAction(ActionId Name)` -> `bool`
5. `ExecuteSelectedAction(ActionId Name, Target Actor)`

---

## Итерация 5 — инициализация и таймеры

### `BPC_AIThreat.BeginPlay`
1. `Set Timer by Function Name` -> `DecayThreatOverTime` (`ThreatUpdateInterval`, loop)
2. `Set Timer by Function Name` -> `ClearInvalidThreatEntries` (`0.5`, loop)

### `BPC_AIUtility.BeginPlay`
1. Закешировать refs (`ThreatComponent`, `StatusComponent`, `HealthComponent`)
2. `Set Timer by Function Name` -> `EvaluateAndSelectAction` (`DecisionIntervalSec`, loop)

Правило:
- Только таймеры/события, без тяжелого постоянного `Tick`.

---

## Итерация 6 — `AddThreat` и decay (node-by-node)

## `AddThreat(Target, Delta)`
1. Проверить `IsValid(Target)`
2. Найти запись в `ThreatTable`
3. Если есть -> `ThreatValue += Delta`, обновить `LastUpdateTime`
4. Если нет -> добавить новую запись

## `DecayThreatOverTime`
1. `Now = GetGameTimeInSeconds`
2. ForEach `ThreatTable`:
   - `ThreatValue -= ThreatDecayPerSec * DeltaTimeApprox`
   - clamp `>= 0`
3. Удалить entries с нулевой угрозой

---

## Итерация 7 — `GetTopThreatTarget` и валидации

1. Удалить invalid/dead targets
2. Выбрать max `ThreatValue`
3. Дополнительно учитывать дистанцию (`ThreatValue * DistanceWeight`)
4. Вернуть top target или `None`

Интеграция:
- `BPC_NPCAICombat` использует этот target как приоритетный для attack/chase.

---

## Итерация 8 — scoring utility actions (node-by-node)

### `EvaluateAndSelectAction`
1. `Target = ThreatComponent.GetTopThreatTarget()`
2. Получить список actions из utility profile
3. Для каждого action:
   - `CanRunAction`
   - `ScoreAction`
4. Выбрать action с max score
5. Если score выше порога -> `ExecuteSelectedAction`
6. `OnAIActionSelected(ActionId, Target, Score)`

### `ScoreAction`
Минимальная формула:
- `Score = BaseScore`
- + бонус за подходящую дистанцию
- + бонус/штраф по HP% NPC
- + бонус/штраф по статусам (например, если stunned -> `Retreat/Idle`)
- + штраф за cooldown-недоступность

---

## Итерация 9 — `CanRunAction` и cooldown gating

1. Проверить `Now - LastActionTimeById[ActionId] >= CooldownSec`
2. Проверить блокирующие статусы (`BlockedByStatusTag`)
3. Проверить required статусы (`RequiredStatusTag`, если задан)
4. Проверить контекст (есть target, дальность, ресурс)
5. Вернуть true/false

---

## Итерация 10 — `ExecuteSelectedAction`

Минимальные маршруты:
1. `Attack` -> вызвать существующий combat basic attack
2. `Chase` -> `AI MoveTo` top threat target
3. `Retreat` -> выбрать точку отхода и `MoveTo`
4. `UseAbility` -> вызвать `BPC_AbilitySystem` у NPC
5. `Idle` -> остановить движение/держать дистанцию

После выполнения:
- обновить `LastActionTimeById[ActionId]`
- записать `CurrentActionId`

---

## Итерация 11 — генерация threat из событий

Источники threat:
1. OnDamageTaken NPC:
   - `AddThreat(DamageCauser, DamageAmount * DamageMultiplier)`
2. OnHealEnemy (если нужно агро на хила):
   - `AddThreat(Healer, HealAmount * HealThreatMultiplier)`
3. Proximity pulse:
   - близкие цели получают базовый threat

Требование:
- threat обновляется событийно, а не только по polling.

---

## Итерация 12 — финальный smoke test

1. NPC выбирает цель с максимальным threat.
2. При получении урона от другого игрока/NPC приоритет цели меняется.
3. Threat постепенно спадает при отсутствии взаимодействия.
4. AI переключается между `Chase/Attack/Retreat/UseAbility` по utility score.
5. Stun/Slow/HP% влияют на выбор действия (через utility constraints).
6. Cooldown не позволяет спамить одно и то же действие.
7. Нет compile errors в:
   - `BPC_AIThreat`
   - `BPC_AIUtility`
   - `BPC_NPCAICombat`
   - `DT_AIUtilityProfiles`

Если все пункты true — Phase 13 закрыта.
