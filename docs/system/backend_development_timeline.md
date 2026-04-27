# Когда разрабатывать серверную часть

Короткий ответ: **начинать проектирование сервера нужно уже сейчас, а полноценную разработку — после стабилизации core gameplay vertical slice**.

---

## 1) Рекомендуемый тайминг по этапам

## Этап A — Сейчас (немедленно, 0–1 неделя)

Что делаем:
1. Определяем границы ответственности client vs server.
2. Фиксируем минимальные backend-домены:
   - Auth/Account
   - Character/Profile
   - Inventory/Equipment state
   - Session/Match/World state
   - Combat/Anti-cheat critical validations
3. Формируем API contracts (request/response + error codes).

Почему сейчас:
- чтобы не переписывать клиентские компоненты позднее;
- чтобы DoD в фазах учитывал server-authoritative flow.

---

## Этап B — После vertical slice (ориентир: когда готовы Phase 1–8 в прототипе)

Что делаем:
1. Поднимаем первый backend MVP:
   - auth,
   - profile load/save,
   - inventory persistence.
2. Переводим критичные операции с «локально» на «через сервер»:
   - выдача лута,
   - изменения инвентаря,
   - экипировка.

Почему здесь:
- в этот момент уже понятен реальный gameplay loop и структура данных;
- меньше риска «дизайн ради дизайна» на бекенде.

---

## Этап C — Перед массовым AI/encounter scaling (ориентир: Phase 11–14)

Что делаем:
1. Вводим server-authoritative combat hooks:
   - ability commit,
   - cooldown/resource validation,
   - status effects apply/remove.
2. Вводим события телеметрии и аудит операций.
3. Закладываем anti-exploit проверки (idempotency, replay protection).

Почему здесь:
- complexity боя и encounter резко растет;
- без сервера будет много client-side уязвимостей.

---

## Этап D — Перед внешними тестами / soft launch

Что делаем:
1. Масштабирование и отказоустойчивость.
2. Миграции схем и versioning.
3. Нагрузочные тесты + disaster recovery сценарии.

---

## 2) Практическое правило принятия решения

Если функция:
- влияет на прогрессию игрока,
- создает/удаляет ресурсы,
- влияет на честность боя,

то она должна быть server-authoritative.

---

## 3) Минимальный backend MVP (порядок)

1. `Auth + Account`
2. `Character Profile`
3. `Inventory/Equipment Persistence`
4. `Combat Validation Core`
5. `Telemetry + Audit`

---

## 4) Что НЕ откладывать

- Error model (`E_OpFailReason` аналоги на сервере)
- Idempotency keys для критичных операций
- Версионирование контрактов (`SchemaVersion`, API version)
- Логи доменных событий (кто/что/когда изменил)

---

## 5) Чек готовности начать серверную разработку

- [ ] Клиентские контракты и data model стабилизированы минимум на vertical slice
- [ ] Есть список server-authoritative операций
- [ ] Есть базовая observability стратегия (logs/metrics/traces)
- [ ] Команда согласовала API error codes и retry policy
- [ ] QA имеет smoke-набор для клиент-серверных сценариев

---

## Резюме

**Проектирование backend — сейчас.**
**MVP реализация — сразу после рабочей вертикали core loop.**
**Полная server-authoritative логика боя/прогрессии — до масштабирования контента и публичных тестов.**
