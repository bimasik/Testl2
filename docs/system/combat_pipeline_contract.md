# Combat Pipeline Contract

Единый контракт порядка боевых этапов для player/NPC/AI.

## Canonical order
1. `PreValidate`
2. `Reserve/CostCheck`
3. `CommitCost`
4. `SnapshotStats`
5. `ApplyPrimaryEffect` (damage/heal/apply status)
6. `ApplySecondaryEffects` (procs/modifiers)
7. `PostProcess` (cooldown/events/log)
8. `Finalize`

## Требования
- Этапы не пропускаются молча: при fail — возвращается `E_OpFailReason`.
- Стоимость ресурса списывается ровно один раз.
- События отправляются после коммита состояния, не до него.
- UI не пересчитывает боевую математику, только отображает runtime state.

## Event order (должен совпадать везде)
1. `AbilityCastStarted`
2. `AbilityCommitted`
3. `Damage/HealApplied`
4. `StatusApplied/Removed/Tick`
5. `AbilityCastFinished`

## Rollback policy
Если ошибка до `CommitCost` — откат не нужен.
Если ошибка после `CommitCost` — обязателен compensating step:
- вернуть ресурс (если эффект не применялся),
- или зафиксировать `partial_success` + доменное событие.

## Minimal fail reasons (`E_OpFailReason`)
- `InvalidTarget`
- `OutOfRange`
- `NotEnoughResource`
- `OnCooldown`
- `BlockedByStatus`
- `MissingDataProfile`
- `InternalStateConflict`
