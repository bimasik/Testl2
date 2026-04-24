# 02. Checklist Phase 14

## Перед запуском
- [ ] Добавлен `BP_EncounterManager` и привязан `DT_EncounterProfiles`
- [ ] Настроены роли NPC (`E_NPCRole`) и role modifiers
- [ ] Реализованы `StartEncounter`, `StartWave`, `HandleNPCDeath`, `CompleteEncounter`
- [ ] Реализованы `AbortEncounter` и `ResetEncounter`

## Smoke test в PIE
- [ ] Encounter стартует корректно и поднимает первую волну
- [ ] Спавн по wave-конфигу соответствует DataTable
- [ ] Волна очищается только после смерти всех живых NPC
- [ ] Следующая волна стартует с учетом `InterWaveDelaySec`
- [ ] Ограничение `MaxAliveNPC` соблюдается
- [ ] Role-based поведение заметно меняет AI решения
- [ ] HUD encounter обновляется по событиям
- [ ] Нет compile errors

- [ ] Есть reconciliation-проверка `AliveNPCs` против фактических акторов
- [ ] Abort/Reset гарантирует очистку таймеров и подписок

## Definition of Done
Phase 14 закрыта, если:
- wave-оркестрация encounter работает предсказуемо end-to-end;
- роли NPC влияют на поведение без дублирования AI логики;
- reset/abort корректно чистят состояние и таймеры;
- событие завершения encounter стабильно триггерится после последней волны;
- adaptive scaling/телеметрия следующего уровня не добавлялись в этой фазе.
