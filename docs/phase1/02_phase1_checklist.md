# 02. Checklist Phase 1

## Проверка перед запуском
- [ ] `BP_PlayerCharacter` наследуется от `BP_CharacterBase`
- [ ] `BPC_PlayerControl` добавлен в `BP_PlayerCharacter`
- [ ] `IMC_PlayerBase` подключается в `BP_PlayerController`
- [ ] Ссылки `OwnerCharacter`/`OwnerPlayerController` кэшируются в `InitializeReferences`
- [ ] Нет повторяющихся Cast в input-событиях

## Smoke test в PIE
- [ ] Click-to-move работает (ЛКМ по земле)
- [ ] Без зажатой ПКМ камера не вращается
- [ ] При зажатой ПКМ камера вращается (Mouse X/Y)
- [ ] Jump работает
- [ ] Камера ведет себя стабильно
- [ ] Нет compile errors

## Definition of Done
Фаза 1 закрыта, если:
- работает ClickMove/Look/Jump;
- поворот камеры работает только при зажатой ПКМ;
- логика управления находится в `BPC_PlayerControl`;
- нет механик будущих фаз.
