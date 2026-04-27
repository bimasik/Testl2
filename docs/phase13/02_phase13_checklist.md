# 02. Checklist Phase 13

## Перед запуском
- [ ] `BPC_AIThreat` и `BPC_AIUtility` добавлены в базовый NPC
- [ ] Заполнен `DT_AIUtilityProfiles`
- [ ] Реализованы `AddThreat`, `GetTopThreatTarget`, `EvaluateAndSelectAction`
- [ ] Решение AI обновляется по таймеру (без heavy Tick)

## Smoke test в PIE
- [ ] NPC фокусит цель с наибольшим threat
- [ ] Threat корректно обновляется при входящем уроне
- [ ] Threat корректно затухает со временем
- [ ] AI меняет действие по utility score и контексту
- [ ] Cooldown блокирует повтор одного action до истечения времени
- [ ] Статусы (stun/slow) влияют на доступность/score действий
- [ ] Нет compile errors

## Definition of Done
Phase 13 закрыта, если:
- система threat определяет приоритет цели детерминированно;
- utility-слой выбирает релевантные действия по текущему состоянию боя;
- cooldown и status constraints применяются консистентно;
- AI решение не зависит от тяжелого постоянного Tick;
- encounter orchestration и групповые роли не добавлялись в этой фазе.
