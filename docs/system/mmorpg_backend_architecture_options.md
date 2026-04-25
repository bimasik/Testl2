# MMORPG Backend: лучшие практики и варианты реализации

Документ отвечает на вопрос: «подходит ли JS для MMORPG-бэка» и какие архитектуры реально использовать в production.

---

## Короткий вывод

1. **JS/Node можно использовать**, но обычно не как единственный слой для всего MMORPG.
2. На практике устойчивее **гибрид**:
   - real-time authoritative loop (Go/C++/C# или готовый движок типа Nakama runtime),
   - meta/backend API (Node/Go/C#),
   - orchestration dedicated servers (Agones/GameLift/PlayFab MPS).
3. Ключ не в языке, а в соблюдении server-authoritative принципов, idempotency, observability и масштабирования.

---

## Что говорят best practices (по источникам)

## 1) Authoritative gameplay
- Сервер должен валидировать и транслировать игровое состояние.
- Фиксированный tick-rate для матч-логики и контроль отставаний.
- Источник: Nakama authoritative multiplayer docs.

## 2) Dedicated server orchestration
- Для session-based real-time игр использовать orchestration слой (Agones/GameLift/PlayFab MPS).
- Разделять control plane и game server workloads.
- Источник: Agones docs + Agones best practices.

## 3) Feature-isolated data stores
- Разделять хранилища по фичам, а не сваливать всё в один monolith DB.
- Источник: AWS Games Industry Lens (serverless-based backend architecture).

## 4) Локальная и cost-aware эксплуатация
- Локальный агент/локальная среда для итераций.
- Capacity/schedule и packing для контроля стоимости.
- Источник: PlayFab MPS best practices.

## 5) Stateful edge модель (опционально)
- Для отдельных real-time use cases можно использовать single-owner state объекты (например Durable Objects).
- Источник: Cloudflare Durable Objects docs.

---

## Варианты реализации (без пошаговых инструкций)

## Option A — Node.js-centric (быстрый старт)

**Стек**
- Node.js (NestJS/Fastify) для API и доменной логики
- Redis (cache/session/queues)
- Postgres (account/profile/economy)
- Agones/GameLift для реального game server процесса

**Когда подходит**
- Команда сильна в TS/JS
- Быстрый выход в MVP

**Риски**
- CPU-heavy симуляции и высокочастотный tick-loop могут упираться в single-thread модель

**Как снизить риски**
- Вынос authoritative combat loop в отдельный сервис/процесс (Go/C#)

---

## Option B — Hybrid (рекомендуемый для MMORPG)

**Стек**
- Node.js: gateway, social, inventory/economy API
- Go/C#: authoritative combat/session services
- Redis + Postgres + object storage
- Agones/GameLift/PlayFab MPS orchestration

**Плюсы**
- Лучше масштабируется под смешанную нагрузку
- Ясное разделение IO-bound и CPU-bound задач

**Минусы**
- Сложнее DevOps и контракты между сервисами

---

## Option C — Managed multiplayer platform-first

**Стек**
- Nakama / PlayFab / GameLift как основа multiplayer session
- Кастомные сервисы только для специфики проекта

**Плюсы**
- Быстрый production hardening
- Меньше platform-операций на старте

**Минусы**
- Ограничения экосистемы и vendor coupling

---

## Что критично независимо от выбора стека

1. Server-authoritative операции для:
   - прогрессии,
   - экономики,
   - боевой валидации.
2. Idempotency keys на критичных write-операциях.
3. Явные failure codes (доменные причины отказа).
4. Наблюдаемость:
   - logs + metrics + traces,
   - отдельные SLO для login/match/ability commit.
5. Версионирование контрактов и схем (SchemaVersion/API version).

---

## Рекомендация для текущего проекта

С учетом текущей базы:
1. Оставить Node.js/Python прототипы как reference contracts.
2. Для production принять **Option B (Hybrid)**:
   - Node.js для API/meta,
   - authoritative combat/session вынести в Go/C# или Nakama runtime.
3. Оркестрацию real-time серверов планировать через Agones/GameLift/PlayFab MPS.

---

## Проверенные источники

- Nakama Authoritative Multiplayer:
  https://heroiclabs.com/docs/nakama/concepts/multiplayer/authoritative/
- Nakama architecture/runtime:
  https://heroiclabs.com/docs/nakama/getting-started/architecture/
- Agones overview:
  https://www.agones.dev/
- Agones best practices:
  https://stable.agones.dev/site/docs/guides/best-practices/
- AWS Games Industry Lens (serverless backend):
  https://docs.aws.amazon.com/wellarchitected/latest/games-industry-lens/serverless-based-game-backend-architecture.html
- PlayFab Multiplayer Servers best practices:
  https://learn.microsoft.com/en-us/gaming/playfab/multiplayer/servers/best-practices
- Cloudflare Durable Objects:
  https://www.cloudflare.com/developer-platform/products/durable-objects/
