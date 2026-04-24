# UI/UX Components Implementation Plan

Короткий ответ: **нет, не нужно реализовывать все UI/UX компоненты сразу**.

Нужно идти поэтапно: сначала core UX для gameplay-loop, затем расширения.

Детальная пошаговая реализация: `docs/ui/01_ui_creation_detailed_instructions.md`.

---

## 1) Что делать в первую очередь (MVP UI)

## P0 (обязательный минимум)
1. `WBP_TargetFrame_Min`
   - выбранная цель, HP%, дистанция
2. `WBP_PlayerVitals_Min`
   - HP/MP (или основной ресурс), статус death/respawn
3. `WBP_AbilityBar_Min`
   - cooldown, disabled state, cast feedback
4. `WBP_StatusBar_Min`
   - активные эффекты, стеки, remaining
5. `WBP_EncounterHUD_Min`
   - wave index, alive count, encounter state

**Причина:** эти виджеты напрямую закрывают основной цикл
`target -> combat -> status -> loot/encounter`.

---

## 2) Что можно отложить (P1/P2)

## P1
- Inventory full-screen polishing
- Equipment compare tooltips
- Combat log panel (расширенный)
- Настраиваемые hotbar слоты

## P2
- Theme/skin system
- Accessibility presets (color-blind profiles, advanced scaling)
- Расширенная анимация UI переходов

---

## 3) Технические правила реализации UI

1. UI не содержит бизнес-логику расчета боя.
2. UI читает состояние через dispatchers/runtime state, не через heavy Tick + Cast.
3. Для всех интерактивных виджетов задать input focus policy.
4. Обновления по таймеру допустимы только там, где нужны remaining values.

---

## 4) Порядок внедрения по PR

1. PR-UI-1: Target/Vitals базовые виджеты
2. PR-UI-2: Ability/Status bars
3. PR-UI-3: Encounter HUD + debug overlay
4. PR-UI-4: Inventory/Equipment UX polish

Каждый PR должен:
- обновить соответствующий phase checklist;
- приложить GIF/скриншоты ключевых сценариев;
- зафиксировать, какие dispatchers используются.

---

## 5) Критерии готовности UI слоя

- Игрок всегда понимает: цель, ресурс, доступность ability, текущие статусы, состояние encounter.
- Нет UI desync с runtime state в smoke test сценариях.
- Нет заметных input conflicts с L2 interaction flow.
