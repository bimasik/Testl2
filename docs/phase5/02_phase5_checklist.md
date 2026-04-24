# 02. Checklist Phase 5

## Перед запуском
- [ ] `BPC_Health` добавлен на нужные акторы
- [ ] Реализован `BPI_Damageable` через `BPC_Health`
- [ ] `InitializeHealth` вызывается на BeginPlay
- [ ] У `BPC_Health` настроены `MaxHP`, `RespawnDelay`, `bAutoRespawn`

## Smoke test в PIE
- [ ] Урон уменьшает HP
- [ ] На 0 HP вызывается смерть
- [ ] На смерти отключается коллизия/движение
- [ ] Через `RespawnDelay` происходит респавн
- [ ] После респавна HP полный
- [ ] Нет compile errors

## Definition of Done
Phase 5 закрыта, если:
- работает цикл damage -> death -> respawn;
- `BPC_CombatBasic` корректно применяет урон через интерфейс;
- нет внедрения скилловой/продвинутой боевой логики.
