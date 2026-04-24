# 02. Checklist Phase 2

## Перед запуском
- [ ] `BPC_Locomotion` добавлен в `BP_PlayerCharacter`
- [ ] `IA_ToggleWalk` создан и добавлен в `IMC_PlayerBase`
- [ ] В `BPC_Locomotion` ссылки кэшируются в `InitializeReferences`
- [ ] Нет повторных Cast в input-событиях

## Smoke test в PIE
- [ ] Click-to-move работает
- [ ] CapsLock переключает walk/run
- [ ] Скорость walk < speed run
- [ ] Камера по ПКМ работает как в Phase 1
- [ ] AnimBP получает `CurrentSpeed`
- [ ] Нет compile errors

## Definition of Done
Phase 2 закрыта, если:
- локомоция изолирована в `BPC_Locomotion`;
- переключение walk/run работает стабильно;
- базовая анимация получает скорость из компонента;
- нет внедрения механик будущих фаз.
