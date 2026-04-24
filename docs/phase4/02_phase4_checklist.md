# 02. Checklist Phase 4

## Перед запуском
- [ ] `BPC_CombatBasic` добавлен в `BP_PlayerCharacter`
- [ ] `BPI_Damageable` создан и реализован на цели
- [ ] `IA_BasicAttack` добавлен в `IMC_PlayerBase`
- [ ] Ссылки кэшируются в `InitializeReferences`

## Smoke test в PIE
- [ ] При выбранной цели на `F` наносится урон
- [ ] Без цели урон не применяется
- [ ] Вне `AttackRange` урон не применяется
- [ ] `AttackCooldown` блокирует спам
- [ ] Нет compile errors

## Definition of Done
Phase 4 закрыта, если:
- работает базовая атака по выбранной цели;
- проверяются target/range/cooldown;
- нет скилловой/сложной боевой логики в этой фазе.
