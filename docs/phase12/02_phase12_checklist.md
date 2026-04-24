# 02. Checklist Phase 12

## Перед запуском
- [ ] `BPC_StatusEffects` добавлен персонажу/базовым NPC
- [ ] Заполнен `DT_StatusEffectsCatalog`
- [ ] Реализованы `ApplyStatusEffect`, `ProcessStatusEffects`, `RemoveStatusEffect`
- [ ] Таймер обработки эффектов настроен (без heavy Tick)

## Smoke test в PIE
- [ ] DoT наносит урон по интервалу и снимается по duration
- [ ] HoT восстанавливает HP по интервалу
- [ ] Stun блокирует действия на время эффекта
- [ ] Slow снижает скорость и корректно снимается
- [ ] Reapply корректно обрабатывает stacks/refresh duration
- [ ] Конфликтующие эффекты обрабатываются по правилу приоритета
- [ ] `WBP_StatusBar_Min` показывает актуальные статусы
- [ ] Нет compile errors

## Definition of Done
Phase 12 закрыта, если:
- status effects работают консистентно для игрока и NPC;
- event pipeline боя детерминирован и удобен для дебага;
- эффекты корректно очищают модификаторы при завершении;
- нет дублированной логики статусов вне `BPC_StatusEffects`;
- продвинутый netcode/античит/сложный PvP-баланс не добавлялись в этой фазе.
