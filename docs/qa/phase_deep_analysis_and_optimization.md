# Deep Analysis: фазы 0–14

Документ фиксирует системные проблемы текущего phase-плана и предлагает конкретные варианты:
- оптимизации кода/Blueprint графов,
- рефакторинга архитектуры,
- декомпозиции компонентов,
- улучшения игровых механик.

---

## 1) Главные системные риски

## 1.1 Дублирование cross-cutting логики
**Симптомы:**
- похожие проверки `IsValid`, target checks, cooldown/resource gating повторяются в разных компонентах;
- часть flow-контрактов описана текстом, но не оформлена как единый reusable слой.

**Риск:**
- drift между системами (AI/Player/Ability), сложный дебаг, расхождение поведения.

**Оптимизация:**
1. Ввести общие utility-функции/Function Library для:
   - time/cooldown checks,
   - безопасного доступа к компонентам,
   - валидации цели/дистанции.
2. Нормализовать события в единый event bus (минимум: damage/heal/status/ability).

---

## 1.2 Слишком «плоские» DataTable контракты
**Симптомы:**
- в фазах много отдельных DT с частично пересекающимися полями;
- отсутствует единый Data Contract Versioning.

**Риск:**
- миграции становятся дорогими, легко сломать backward compatibility.

**Оптимизация:**
1. Ввести поле `SchemaVersion` в ключевые структуры (ability/status/equipment/encounter).
2. Завести `docs/data/contracts_matrix.md` (какая система читает какие поля).
3. Добавить pre-flight валидатор DataTable (editor utility):
   - обязательные поля,
   - диапазоны значений,
   - ссылки на существующие assets.

---

## 1.3 Неявные транзакции между системами
**Симптомы:**
- inventory/equipment/status/ability используют последовательные операции, но без явных rollback-контрактов.

**Риск:**
- частичные состояния при ошибке (особенно в edge-case сценариях).

**Оптимизация:**
1. Для критичных операций ввести паттерн `TryCommit`:
   - `Validate -> Reserve -> Apply -> Confirm`.
2. Для rollback добавить единый набор failure-кодов (`enum E_OpFailReason`).

---

## 2) Анализ по фазовым блокам

## 2.1 Phase 1–4 (input/control/target/combat)
**Проблемы:**
- target selection и execute action описаны корректно, но нет formal state guard таблицы;
- combat и targeting завязаны на порядок вызовов, а не на явный state machine.

**Рефакторинг:**
1. Вынести target state machine в отдельный компонент `BPC_TargetStateMachine`.
2. Добавить таблицу переходов `State x Event -> NextState + Action`.
3. Описать единый `ICombatActor` интерфейс для player/NPC.

**Механики:**
- добавить soft lock-on cone и sticky-target timeout;
- добавить grace-window для повторного клика по той же цели (лучший UX L2-like).

---

## 2.2 Phase 5–8 (health/loot/inventory)
**Проблемы:**
- loot/inventory потоки не фиксируют idempotency для повторных input-событий;
- stack/slot логика может стать тяжелой на больших инвентарях.

**Рефакторинг/оптимизация:**
1. Ввести `InventoryTransactionId` для защиты от double pickup.
2. Добавить index map `ItemId -> ArrayIndices` для ускорения stack операций.
3. Разделить `BPC_Inventory` на:
   - `InventoryStorage` (данные),
   - `InventoryRules` (валидации),
   - `InventoryEvents` (dispatchers).

**Механики:**
- quality tiers и авто-сортировка;
- configurable loot vacuum radius (по опции).

---

## 2.3 Phase 9–10 (equipment/stats/visual)
**Проблемы:**
- риск рассинхрона между визуалом и stat state;
- attach/detach visuals без pooling может быть дорогим.

**Рефакторинг/оптимизация:**
1. Ввести единую функцию `RebuildEquipmentState`:
   - data sync -> stat apply -> visual sync -> emit events.
2. Использовать pooling для visual actors (минимум для часто сменяемых слотов).
3. Кэшировать sockets/attach rules в precomputed lookup.

**Механики:**
- set bonuses (минимум 2/4-piece) как следующий слой;
- conditional modifiers (ночь/биом/цель) для глубины билдов.

---

## 2.4 Phase 11–12 (abilities/status)
**Проблемы:**
- cooldown/resource/status логика может раздвоиться между ability и status компонентами;
- отсутствует явная приоритизация порядка применения модификаторов (pre/post damage).

**Рефакторинг/оптимизация:**
1. Ввести combat pipeline order как обязательный контракт:
   - PreValidate -> Cost -> SnapshotStats -> ApplyEffect -> PostProcess.
2. Отделить `StatusApplicationRules` от runtime хранения эффектов.
3. Для ticking эффектов использовать bucketed timers (0.1/0.2/0.5), а не отдельный timer на каждый effect.

**Механики:**
- diminishing returns для CC;
- cleanse/dispel категории (magic/physical/control);
- combo tags: бонус при последовательности разных школ abilities.

---

## 2.5 Phase 13–14 (AI utility/threat/encounter)
**Проблемы:**
- utility scoring и threat decay могут быть нестабильны без нормализации шкал;
- wave orchestration зависит от корректных death events (хрупкая точка).

**Рефакторинг/оптимизация:**
1. Нормализовать score в диапазон [0..1] + объяснимые weight-профили.
2. Ввести fallback reconciliation таймер в encounter manager:
   - периодическая сверка `AliveNPCs` с фактическими акторами на сцене.
3. Роли NPC вынести в data-driven role modifiers (без hardcode в графах).

**Механики:**
- динамические волны по tempo боя (time-to-kill, входящий урон);
- counter-composition: encounter подмешивает роли против текущего билда игрока;
- mini-objectives в волнах (kill support first, interrupt elite cast).

---

## 3) Рекомендованная декомпозиция компонентов (target architecture)

## 3.1 Player side
- `BPC_PlayerInputRouter`
- `BPC_TargetStateMachine`
- `BPC_CombatExecutor`
- `BPC_AbilitySystem`
- `BPC_StatusEffects`
- `BPC_InventoryStorage` + `BPC_EquipmentState`

## 3.2 NPC side
- `BPC_NPCCombatCore`
- `BPC_AIThreat`
- `BPC_AIUtility`
- `BPC_NPCRoleProfile`

## 3.3 Shared
- `BPFL_CombatMath`
- `BPFL_Validation`
- `BPFL_TimeAndCooldown`
- `BPC_EventRelay` (combat domain events)

---

## 4) Пошаговый рефакторинг без «большого взрыва»

## Шаг A (низкий риск)
1. Вынести дублируемые валидации в Function Library.
2. Добавить enum failure-кодов в транзакции inventory/equipment/ability.
3. Ввести стандарт именования для dispatcher payload.

## Шаг B (средний риск)
1. Перевести status tick в bucketed scheduler.
2. Сделать unified combat pipeline contract.
3. Нормализовать utility scoring и weights из DataTable.

## Шаг C (высокий эффект)
1. Разделить storage/rules/events в inventory/equipment.
2. Ввести target state machine как отдельный модуль.
3. Добавить encounter reconciliation/fail-safe слой.

---

## 5) Улучшения игровых механик (приоритет)

## P1 — быстрые улучшения
- smarter target assist (sticky + angle priority)
- readable cooldown telegraph в UI (color states + last-0.5s pulse)
- loot QoL: auto-stack first + partial pickup feedback

## P2 — боевое разнообразие
- role-synergy encounter rules (support+elite combos)
- CC diminishing returns
- equipment conditional bonuses (context-aware)

## P3 — долгосрочные
- adaptive encounter scaling по performance метрикам
- seasonal modifiers/affixes для replayability
- analytics-driven balance loop (telemetry -> tuning tables)

---

## 6) Что обновить в документации следующими PR

1. Добавить `contracts_matrix.md` (кто читает/пишет какие структуры).
2. Добавить `combat_pipeline_contract.md` с фиксированным порядком этапов.
3. Добавить `data_validation_checklist.md` для всех DT.
4. Расширить чеклисты фаз пунктом «idempotency/rollback проверен».

