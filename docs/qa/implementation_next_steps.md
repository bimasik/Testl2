# Next Steps: переход от документации к реализации

Документ отвечает на вопрос «что делать дальше» после стабилизации phase-документации.

## Цель на ближайшие 4–6 недель
Перейти от проектирования к итеративной реализации с проверяемыми инкрементами:
1. закрепить инфраструктурные контракты;
2. реализовать вертикальный срез core-геймплея;
3. включить QA/метрики;
4. подготовить масштабирование AI/encounter.

---

## Step 1 — Закрыть foundation (1 неделя)

## Что сделать
- Принять как обязательные артефакты:
  - `docs/system/combat_pipeline_contract.md`
  - `docs/data/contracts_matrix.md`
  - `docs/qa/data_validation_checklist.md`
- Добавить lightweight code-owner правило на изменения этих файлов.
- Ввести `E_OpFailReason` в базовые Blueprint API (ability/inventory/equipment).

## DoD
- Все новые PR с геймплейной логикой ссылаются на contract docs.
- В критичных потоках нет только `bool`-результатов без причины отказа.

---

## Step 2 — Вертикальный срез V1 (1–2 недели)

## Scope
- Player control + targeting + basic combat
- Health + loot + inventory pickup
- Минимальный UI для cooldown/status/loot feedback

## Что важно
- Соблюдать порядок `combat pipeline`.
- Проверить idempotency pickup и rollback в inventory/equipment.
- Для частых апдейтов использовать timer/event-driven подход.

## DoD
- End-to-end сценарий: target -> attack -> kill -> drop -> pickup работает стабильно.
- Нет рассинхрона UI и runtime state.

---

## Step 3 — AI/Encounter production baseline (1–2 недели)

## Scope
- `BPC_AIThreat` + `BPC_AIUtility`
- `BP_EncounterManager` с волнами и ролями
- Fail-safe: reconciliation, abort/reset

## DoD
- NPC выбирают цели детерминированно.
- Encounter корректно завершается и перезапускается.
- Нет «висячих» таймеров и подписок после reset/abort.

---

## Step 4 — QA automation layer (параллельно)

## Что автоматизировать в первую очередь
- Проверка DataTable обязательных полей/диапазонов.
- Smoke-набор для критичных транзакций:
  - equip/unequip,
  - ability commit/cooldown,
  - status apply/remove.
- Regression checklist для encounter progression.

## DoD
- Минимум один автоматический check на каждый критичный data/transaction path.

---

## Step 5 — Баланс и улучшения механик (после baseline)

## Приоритет
1. Target assist / lock quality
2. CC diminishing returns
3. Encounter adaptive scaling
4. Telemetry-driven tuning

## DoD
- Метрики (TTK, fail rate, average encounter duration) собираются и видны команде.

---


## UI/UX note
Не реализуем весь UI/UX слой сразу.
Сначала P0-виджеты gameplay-loop, затем P1/P2 расширения (см. `docs/qa/ui_ux_components_implementation_plan.md`).

## Рекомендуемый порядок PR
1. PR-A: contracts + fail-reason enums + validation hooks
2. PR-B: vertical slice gameplay implementation
3. PR-C: AI utility/threat + encounter manager
4. PR-D: QA automation + telemetry basics

Каждый PR должен обновлять затронутые phase checklist и ссылаться на соответствующие контрактные документы.
