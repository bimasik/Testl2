# 02. Checklist Phase 11

## Перед запуском
- [ ] `BPC_AbilitySystem` добавлен в `BP_PlayerCharacter`
- [ ] Заполнен `DT_AbilityCatalog`
- [ ] Реализованы `CanActivateAbility` и `TryActivateAbility`
- [ ] Реализованы списание ресурса и старт кулдауна

## Smoke test в PIE
- [ ] Ability активируется по input-слоту
- [ ] При нехватке ресурса активация корректно отклоняется
- [ ] При успешной активации ресурс списывается 1 раз
- [ ] Кулдаун блокирует повторную активацию до истечения времени
- [ ] Эффект способности применяется к валидной цели/владельцу
- [ ] `WBP_AbilityBar_Min` показывает cooldown и disabled state
- [ ] Нет compile errors

## Definition of Done
Phase 11 закрыта, если:
- базовая ability-система работает end-to-end (input -> validation -> cost -> effect -> cooldown);
- UI отражает состояние способностей без несинхрона;
- модификаторы от статов применяются консистентно;
- отсутствуют дублирующие списания ресурса/двойные применения эффекта;
- сложные status effects и combat pipeline следующего уровня не добавлялись в этой фазе.
