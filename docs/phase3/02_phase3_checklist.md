# 02. Checklist Phase 3

## Перед запуском
- [ ] `BPC_Targeting` добавлен в `BP_PlayerCharacter`
- [ ] `BPI_Targetable` создан
- [ ] `IA_TargetClick` и `IA_ClearTarget` добавлены в `IMC_PlayerBase`
- [ ] Ссылки в `BPC_Targeting` кэшируются в `InitializeReferences`

## Smoke test в PIE
- [ ] ЛКМ по таргетируемому актору выбирает цель
- [ ] Имя цели показывается в `WBP_TargetFrame_Min`
- [ ] Esc очищает таргет
- [ ] Невалидная цель очищается через `ValidateCurrentTarget`
- [ ] Нет compile errors

## Definition of Done
Phase 3 закрыта, если:
- таргет выбирается кликом;
- цель валидируется и корректно сбрасывается;
- UI цели обновляется через `OnTargetChanged`;
- нет боевой логики в этой фазе.
