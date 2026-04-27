# Data Validation Checklist (DataTable / Structs)

Используется перед merge изменений в data-контракты.

## 1) Contract integrity
- [ ] У структуры есть владелец (source of truth)
- [ ] Указан `SchemaVersion` (для критичных контрактов)
- [ ] Изменения несовместимых полей отражены в changelog

## 2) DataTable rows
- [ ] Все обязательные поля заполнены
- [ ] Нет дубликатов `RowName` / `Id`
- [ ] Числовые поля в допустимых диапазонах
- [ ] Все ссылки на assets валидны

## 3) Runtime safety
- [ ] Есть fallback поведение при отсутствии row
- [ ] Ошибки data приводят к контролируемому fail, не к crash
- [ ] Проверены edge cases (нулевые/отрицательные значения, пустые теги)

## 4) Cross-system consistency
- [ ] Контракт обновлен в `docs/data/contracts_matrix.md`
- [ ] Чеклисты затронутых фаз обновлены
- [ ] Smoke test покрывает новый/измененный data path

## 5) Transaction/idempotency
- [ ] Для многошаговой операции описан rollback/fail reason
- [ ] Повторный вызов операции не ломает состояние (idempotency или защита)
