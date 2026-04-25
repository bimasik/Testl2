# 02. Checklist Phase 9

## Перед запуском
- [ ] `BPC_Equipment` добавлен в `BP_PlayerCharacter`
- [ ] `BPC_Equipment` кэширует ссылку на `BPC_Inventory` в `BeginPlay`
- [ ] Реализованы `EquipItem` и `UnequipItem`
- [ ] Есть `OnEquipmentChanged` dispatcher

## Smoke test в PIE
- [ ] Экипировка предмета удаляет его из инвентаря
- [ ] Предмет появляется в `EquippedItems` в правильном слоте
- [ ] Повторная экипировка в занятый слот делает safe unequip + equip
- [ ] Снятие предмета возвращает его в инвентарь
- [ ] При невозможности вернуть предмет в инвентарь слот не теряет item
- [ ] `WBP_Equipment_Min` обновляется через `OnEquipmentChanged`
- [ ] Нет compile errors

- [ ] Операции equip/unequip описаны как транзакции с rollback
- [ ] При сбое после частичного шага состояние инвентаря/слота консистентно

## Definition of Done
Phase 9 закрыта, если:
- экипировка/снятие работает как транзакция между `BPC_Inventory` и `BPC_Equipment`;
- состояние слотов и инвентаря остается консистентным при ошибках;
- UI корректно отражает занятые/пустые слоты;
- нет логики боевых статов и визуального mesh attach в этой фазе.
