# 02. Checklist Phase 6

## Перед запуском
- [ ] `BPC_NPCAICombat` добавлен в `BP_EnemyBase`
- [ ] Инициализация ссылок (`OwnerCharacter`, `OwnerController`, `SpawnLocation`) работает
- [ ] Таймер `UpdateState` запущен
- [ ] Настроены радиусы `Aggro/LoseTarget/Leash/AttackRange`

## Smoke test в PIE
- [ ] NPC в Idle ищет цель в `AggroRadius`
- [ ] NPC переходит в Chase и бежит к игроку
- [ ] NPC атакует в `AttackRange`
- [ ] При выходе игрока за дистанцию NPC возвращается домой
- [ ] После возврата в точку NPC снова Idle
- [ ] Нет compile errors

## Definition of Done
Phase 6 закрыта, если:
- работает цикл Idle -> Chase -> Attack -> Return;
- корректно обрабатываются потеря цели и leash;
- после смерти/респавна NPC цикл восстанавливается;
- нет продвинутой AI-логики вне scope фазы.
