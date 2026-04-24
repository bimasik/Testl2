# 02. Checklist Phase 7

## Перед запуском
- [ ] `BPC_LootDrop` добавлен в `BP_EnemyBase`
- [ ] `S_LootEntry` создан
- [ ] `DT_LootTable_Basic` заполнен тестовыми строками
- [ ] `BP_LootDropActor` создан и имеет `InitializeDrop`

## Smoke test в PIE
- [ ] На смерти NPC вызывается `RollAndSpawnLoot`
- [ ] Дроп появляется в мире рядом с NPC
- [ ] Шанс дропа учитывается корректно
- [ ] Количество предметов в диапазоне `MinCount..MaxCount`
- [ ] Дроп не спавнится без смерти
- [ ] Нет compile errors

## Definition of Done
Phase 7 закрыта, если:
- работает world-drop после смерти NPC;
- dTable + roll логика отрабатывает корректно;
- нет логики инвентаря/пикапа в этой фазе.
