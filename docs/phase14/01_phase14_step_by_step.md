# 01. Phase 14 — encounter orchestration (waves + roles) (подробно по нодам)

Фаза 14 начинается после закрытой Phase 13 (threat/utility AI уже работает).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Actors/BP_EncounterManager`
- `Content/_Core/Data/Enums/E_NPCRole`
- `Content/_Core/Data/Structs/S_WaveEntry`
- `Content/_Core/Data/Structs/S_EncounterConfig`
- `Content/_Core/Data/DT/DT_EncounterProfiles`
- `Content/_Core/UI/WBP_EncounterHUD_Min`

Обнови:
- `BP_NPCCharacter_Base`
- `BPC_NPCAICombat` / `BPC_AIUtility`
- уровень/спавн-поинты

---

## Итерация 2 — роли и конфиг волн

## `E_NPCRole`
Минимальные роли:
1. `Frontliner`
2. `Ranged`
3. `Support`
4. `Elite`

## `S_WaveEntry`
Поля:
1. `WaveIndex` (`int`)
2. `SpawnDelaySec` (`float`)
3. `NPCArchetype` (`Class`)
4. `Count` (`int`)
5. `Role` (`E_NPCRole`)
6. `SpawnPointTag` (`Name`)

## `S_EncounterConfig`
Поля:
1. `EncounterId` (`Name`)
2. `Waves` (`Array<S_WaveEntry>`)
3. `MaxAliveNPC` (`int`)
4. `InterWaveDelaySec` (`float`)
5. `bScaleByPlayerCount` (`bool`)

---

## Итерация 3 — `DT_EncounterProfiles`

Создай `DT_EncounterProfiles`.

Минимальные колонки:
1. `EncounterId`
2. `Waves`
3. `MaxAliveNPC`
4. `InterWaveDelaySec`
5. `bScaleByPlayerCount`

Правило:
- Каждый encounter в уровне должен ссылаться на валидный профиль из DataTable.

---

## Итерация 4 — скелет `BP_EncounterManager`

## Переменные
1. `EncounterId` (`Name`)
2. `EncounterProfileDT` (`DataTable` ref)
3. `CurrentConfig` (`S_EncounterConfig`)
4. `CurrentWaveIndex` (`int`)
5. `AliveNPCs` (`Array<Actor>`)
6. `bEncounterActive` (`bool`)
7. `bEncounterCompleted` (`bool`)
8. `CachedSpawnPoints` (`Array<Transform/Actor>`)

## Dispatchers
- `OnEncounterStarted(EncounterId Name)`
- `OnWaveStarted(WaveIndex int)`
- `OnWaveCleared(WaveIndex int)`
- `OnEncounterCompleted(EncounterId Name)`

## Функции
1. `InitializeEncounter`
2. `StartEncounter`
3. `StartWave(WaveIndex int)`
4. `SpawnWaveEntry(Entry S_WaveEntry)`
5. `HandleNPCDeath(NPC Actor)`
6. `TryStartNextWave`
7. `CompleteEncounter`

---

## Итерация 5 — инициализация (node-by-node)

1. Event `BeginPlay`
2. `InitializeEncounter`

### `InitializeEncounter`
1. Загрузить row по `EncounterId` из `DT_EncounterProfiles`
2. `Set CurrentConfig`
3. Найти/закешировать spawn points по тегам
4. Сбросить `CurrentWaveIndex = -1`, `AliveNPCs.Clear`
5. `bEncounterActive = false`, `bEncounterCompleted = false`

Проверка:
- Конфиг и spawn points валидны до старта.

---

## Итерация 6 — старт encounter и первой волны

### `StartEncounter`
1. Guard: если `bEncounterActive` или `bEncounterCompleted` -> return
2. `bEncounterActive = true`
3. `OnEncounterStarted`
4. `TryStartNextWave`

### `TryStartNextWave`
1. Если `AliveNPCs.Num > 0` -> return
2. `CurrentWaveIndex += 1`
3. Проверить выход за пределы `Waves`
   - если нет больше волн -> `CompleteEncounter`
4. Иначе:
   - `OnWaveStarted(CurrentWaveIndex)`
   - запланировать `StartWave(CurrentWaveIndex)` через `InterWaveDelaySec`

---

## Итерация 7 — `StartWave` и `SpawnWaveEntry` (node-by-node)

### `StartWave(WaveIndex)`
1. Взять все `S_WaveEntry`, где `WaveIndex` совпадает
2. Для каждого entry:
   - `SetTimer` с `SpawnDelaySec` на `SpawnWaveEntry(entry)`

### `SpawnWaveEntry(Entry)`
1. Рассчитать итоговый `SpawnCount` (учесть scaling по игрокам)
2. For-loop `SpawnCount`:
   - выбрать spawn point по `SpawnPointTag`
   - `SpawnActor(Entry.NPCArchetype)`
   - назначить role в NPC (`SetRole(Entry.Role)`)
   - подписаться на death event NPC -> `HandleNPCDeath`
   - добавить в `AliveNPCs`
3. Ограничить `AliveNPCs` по `MaxAliveNPC` (очередь/дозаспавн)

---

## Итерация 8 — `HandleNPCDeath` и зачистка волны

### `HandleNPCDeath(NPC)`
1. Удалить NPC из `AliveNPCs`
2. Если `AliveNPCs` пуст:
   - `OnWaveCleared(CurrentWaveIndex)`
   - `TryStartNextWave`

Важно:
- Валидировать actor перед удалением (cleanup после destroy).

---

## Итерация 9 — роль-ориентированное поведение NPC

При спавне/инициализации роли:
1. `Frontliner`:
   - выше агрессия, ближняя дистанция, выше threat gain
2. `Ranged`:
   - держит дистанцию, utility bias на `Chase/UseAbility`
3. `Support`:
   - utility bias на heal/buff/dispel
4. `Elite`:
   - повышенные статы, особые cooldown modifiers

Реализация:
- role задает коэффициенты для `BPC_AIUtility`/`BPC_AIThreat`,
  не дублируем AI логику в каждом NPC классе.

---

## Итерация 10 — fail-safe и reset encounter

Добавь функции:
1. `AbortEncounter(Reason)`
2. `ResetEncounter()`

### `AbortEncounter`
- останавливает таймеры волн/спавна
- снимает подписки death events
- ставит `bEncounterActive = false`

### `ResetEncounter`
- удаляет оставшихся encounter NPC
- очищает массивы/состояния
- готовит manager к повторному старту

---

## Итерация 11 — HUD и debug

### `WBP_EncounterHUD_Min`
Показывает:
1. `EncounterId`
2. `CurrentWaveIndex`
3. `AliveNPCCount / MaxAliveNPC`
4. статус `Active/Cleared/Completed`

Подписки:
- `OnEncounterStarted`
- `OnWaveStarted`
- `OnWaveCleared`
- `OnEncounterCompleted`

Опционально:
- dev debug кнопки `Start`, `Abort`, `Reset`.

---

## Итерация 12 — финальный smoke test

1. Encounter стартует по триггеру и поднимает wave 0.
2. NPC спавнятся в корректных точках и ролях.
3. При смерти всех NPC волна очищается и стартует следующая.
4. `MaxAliveNPC` ограничивает одновременное количество врагов.
5. Role modifiers реально влияют на выбор поведения AI.
6. После последней волны корректно вызывается `OnEncounterCompleted`.
7. `Abort/Reset` не оставляют «висячие» таймеры/подписки.
8. Нет compile errors в:
   - `BP_EncounterManager`
   - `BPC_AIUtility`
   - `BPC_NPCAICombat`
   - `DT_EncounterProfiles`

Если все пункты true — Phase 14 закрыта.
