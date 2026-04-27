# 02. Заполнение мира мобами (пошаговый план)

Цель: наполнить биомы живыми PvE-группами так, чтобы игрок чувствовал стабильную прогрессию сложности и разнообразие поведения.

---

## 1) Базовые принципы популяции мобов

1. У каждой зоны есть **уровневой коридор** и **роль мобов**.
2. На маршруте игрока чередуются:
   - trash pack,
   - patrol,
   - elite pocket,
   - event encounter.
3. Мобы должны работать через уже описанные системы:
   - `BPC_NPCAICombat`
   - `BPC_AIThreat`
   - `BPC_AIUtility`
   - `BP_EncounterManager`

---

## 2) Архетипы мобов (минимум)

Создай 6 базовых archetype:
1. `Mob_Melee_Grunt`
2. `Mob_Ranged_Skirmisher`
3. `Mob_Tank_Bruiser`
4. `Mob_Support_Shaman`
5. `Mob_Elite_Commander`
6. `Mob_WorldBoss_Min`

Для каждого archetype зафиксируй:
- базовые статы,
- role (`Frontliner/Ranged/Support/Elite`),
- utility profile,
- набор abilities/status эффектов,
- loot profile.

---

## 3) Распределение по биомам (Shattered Frontier)

## Haven Basin (старт)
- Уровень: low
- Состав:
  - 70% melee trash
  - 20% ranged
  - 10% mini-elite
- Правило: низкая летальность, высокая читаемость боя.

## Ash Dunes (mid)
- Уровень: mid
- Состав:
  - 40% melee
  - 35% ranged
  - 15% support
  - 10% elite patrol
- Правило: больше pressure на позиционирование.

## Frostbreak Ridge (mid-high)
- Уровень: mid-high
- Состав:
  - 35% melee
  - 30% ranged
  - 20% control/support
  - 15% elite
- Правило: акцент на control effects и punish за ошибки.

## Verdant Ruins (high)
- Уровень: high
- Состав:
  - 30% melee
  - 30% ranged
  - 20% support
  - 20% elite/mini-boss
- Правило: групповые синергии мобов и multi-pack риски.

## Fracture Core (endgame pocket)
- Уровень: endgame
- Состав:
  - event-based волны + босс-фазы
- Правило: encounter orchestration + role-synergy.

---

## 4) Data-driven таблицы (обязательно)

Создай таблицы:
1. `DT_MobArchetypes`
2. `DT_ZoneMobPopulation`
3. `DT_SpawnPointsByZone`
4. `DT_MobLootProfiles`

## `DT_MobArchetypes` поля
- `MobId`
- `NPCClass`
- `Role`
- `BaseLevel`
- `StatProfileId`
- `UtilityProfileId`
- `AbilitySetId`
- `LootProfileId`

## `DT_ZoneMobPopulation` поля
- `ZoneId`
- `MobId`
- `Weight`
- `MinGroupSize`
- `MaxGroupSize`
- `SpawnMode` (`Static` / `Patrol` / `Event`)
- `RespawnSec`

---

## 5) Пошаговая реализация в UE5

## Step A — Точки спавна
1. В каждой зоне расставь spawn anchors:
   - `SPWN_ZoneName_###`
2. Назначь теги:
   - `Zone.Haven`, `Zone.Ash`, ...
3. Отдельно отметь:
   - patrol routes,
   - elite arenas,
   - event trigger areas.

## Step B — Spawner manager
1. Создай `BP_ZoneMobSpawner`.
2. На `BeginPlay`:
   - загрузи `DT_ZoneMobPopulation` по `ZoneId`
   - закешируй доступные spawn points
3. Таймерно проверяй population targets:
   - если активных мобов меньше target -> дозаспавн

## Step C — Группы мобов
1. Спавни не одиночек, а группы `MinGroupSize..MaxGroupSize`.
2. В группе назначай leader (обычно `Tank`/`Elite`).
3. Support мобам задавай позицию сзади leader.

## Step D — Поведение
1. Подключи role modifiers из `BPC_AIUtility`/`BPC_AIThreat`.
2. Для ranged/support добавь retreat distance.
3. Для elite включи фазовые ability conditions (HP thresholds).

## Step E — Respawn логика
1. На death моба стартуй timer `RespawnSec`.
2. При respawn проверяй:
   - вражеская активность поблизости,
   - лимит максимального alive count,
   - cooldown на элитные спавны.

---

## 6) Тюнинг сложности

## Быстрые ручки баланса
- `MobDamageMultiplierByZone`
- `MobHPMultiplierByZone`
- `PackSizeByZone`
- `EliteChanceByZone`
- `RespawnSecByZone`

## Правило
Сначала настраивай **pack composition**, и только потом множители урона/HP.

---

## 7) Интеграция с encounter (Phase 14)

1. Event pockets используют `BP_EncounterManager`.
2. Open-world population не конфликтует с encounter waves:
   - разные spawn channels
   - разные alive-limits
3. После encounter cleanup world population восстанавливается плавно.

---

## 8) Мини-чеклист QA (мобы)

- [ ] В каждой зоне видна разница threat/utility поведения
- [ ] Support мобы реально поддерживают pack, а не стоят idle
- [ ] Patrol routes работают стабильно (без stuck)
- [ ] Elite спавны редкие и читаемые
- [ ] Respawn не происходит «в лицо» игроку
- [ ] FPS не падает при максимальной population нагрузке
- [ ] Лут/опыт соответствуют tier зоны

---

## 9) Вертикальный slice для старта

Сначала запусти только 2 зоны:
1. `Haven Basin`
2. `Ash Dunes`

Сценарий проверки:
- 10 минут чистого фарма,
- 1 elite patrol бой,
- 1 event pocket бой,
- проверка respawn и loot cadence.

Если это стабильно — масштабируй на остальные биомы.
