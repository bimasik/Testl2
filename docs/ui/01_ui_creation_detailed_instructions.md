# 01. Подробные инструкции: как создавать UI в проекте (Unreal / UMG)

Документ — практический гайд «с нуля» для сборки UI-слоя без нарушения архитектурных правил проекта.

---

## 0) Что считаем правильным UI в этом проекте

UI должен:
1. Отображать runtime state (target, hp/mp, cooldown, statuses, encounter).
2. Не содержать боевую бизнес-логику.
3. Обновляться через dispatchers/события/легкие таймеры, а не через heavy `Tick` + `Cast`.
4. Соблюдать L2 interaction и combat pipeline контракты.

См.:
- `docs/system/interaction_l2.md`
- `docs/system/combat_pipeline_contract.md`
- `docs/phase0/06_blueprint_rules.md`

---

## 1) Базовая структура UI-ассетов

Создай папки:
- `Content/_Core/UI/Core`
- `Content/_Core/UI/HUD`
- `Content/_Core/UI/Widgets`
- `Content/_Core/UI/Styles`

Рекомендуемые виджеты MVP:
1. `WBP_HUDRoot`
2. `WBP_TargetFrame_Min`
3. `WBP_PlayerVitals_Min`
4. `WBP_AbilityBar_Min`
5. `WBP_StatusBar_Min`
6. `WBP_EncounterHUD_Min`

---

## 2) WBP_HUDRoot (контейнер)

## Цель
Единая точка инициализации всех sub-widgets.

## Шаги
1. Создай `WBP_HUDRoot` (`UserWidget`).
2. В Designer:
   - Root: `Canvas Panel`
   - Добавь 5 дочерних контейнеров (Target/Vitals/Ability/Status/Encounter)
3. Для каждого sub-widget используй `Named Slot` или прямой `UserWidget` child.

## Логика (Event Construct)
1. Получи `Owning Player Pawn`.
2. Получи ссылки на компоненты игрока (target/combat/ability/status/inventory/equipment/encounter-source).
3. Передай ссылки в sub-widgets через функцию `InitializeWidgetContext`.

Важно:
- Никаких повторных `Cast` в каждом кадре.
- Все ссылки валидируй один раз и кэшируй.

---

## 3) Общий шаблон sub-widget (обязательно)

Для каждого виджета сделай одинаковый каркас:

## Переменные
- `OwnerPawn`
- `bInitialized`
- `UpdateInterval` (например `0.1` если нужен remaining-time)

## Функции
1. `InitializeWidgetContext(OwnerPawn)`
2. `BindToDispatchers()`
3. `UnbindFromDispatchers()`
4. `RefreshView()`

## Lifecycle
- `Construct` -> инициализация + bind
- `Destruct` -> unbind

Это защищает от утечек подписок.

---

## 4) WBP_TargetFrame_Min (пошагово)

## UI элементы
- `Text_TargetName`
- `Progress_TargetHP`
- `Text_Distance`
- `Border_TargetState`

## Источник данных
- Targeting component (`OnTargetChanged`, `OnTargetCleared`)
- Health component target-а (`OnHealthChanged`)

## Node-by-node
1. В `InitializeWidgetContext`:
   - получить `BPC_Targeting` у игрока
   - bind на `OnTargetChanged`
2. В `OnTargetChanged(TargetActor)`:
   - сохранить `CurrentTarget`
   - bind на health target-а
   - `RefreshView`
3. В `RefreshView`:
   - если target валиден: показать имя/HP/дистанцию
   - если нет: скрыть target frame

## Проверка
- Смена цели мгновенно обновляет виджет.
- При смерти цели frame очищается.

---

## 5) WBP_PlayerVitals_Min (пошагово)

## UI элементы
- `Progress_HP`
- `Progress_MP`
- `Text_Level` (опционально)
- `Text_State` (Alive/Dead)

## Источник данных
- `BPC_Health` / `BPC_AttributeSet`
- события: `OnHealthChanged`, `OnResourceChanged`, `OnDeathStateChanged`

## Node-by-node
1. В `BindToDispatchers` подпишись на 3 события.
2. В каждом событии вызывай `RefreshView`.
3. В `RefreshView`:
   - вычисли проценты (`Current/Max`)
   - обнови progress bars
   - если dead: покажи state label/оверлей

---

## 6) WBP_AbilityBar_Min (пошагово)

## UI элементы
- 2–6 кнопок/слотов ability
- cooldown overlay (image mask)
- disabled tint
- optional cast bar

## Источник данных
- `BPC_AbilitySystem`
- события: `OnAbilityCastStarted`, `OnAbilityCastFinished`, `OnAbilityCooldownChanged`

## Node-by-node
1. На init получи `KnownAbilities` и создай слот-виджеты.
2. Для каждого slot:
   - храни `AbilityId`
   - подписывайся на обновления cooldown
3. В `OnAbilityCooldownChanged`:
   - обнови remaining
   - пересчитай fill overlay
4. В input-обработке:
   - UI только прокидывает команду в ability component
   - UI НЕ решает, можно ли кастовать (это делает gameplay слой)

---

## 7) WBP_StatusBar_Min (пошагово)

## UI элементы
- горизонтальный список status icons
- stack counter
- remaining timer text

## Источник данных
- `BPC_StatusEffects`
- события: `OnStatusApplied`, `OnStatusRemoved`, `OnStatusTick`

## Node-by-node
1. `OnStatusApplied`:
   - создать/обновить элемент статуса
2. `OnStatusRemoved`:
   - удалить элемент
3. remaining time:
   - легкий UI-таймер `0.1s` для уже известных эффектов
   - без доп. cast в timer callback

---

## 8) WBP_EncounterHUD_Min (пошагово)

## UI элементы
- `Text_EncounterId`
- `Text_Wave`
- `Text_AliveCount`
- `Text_State`

## Источник данных
- `BP_EncounterManager`
- события: `OnEncounterStarted`, `OnWaveStarted`, `OnWaveCleared`, `OnEncounterCompleted`

## Node-by-node
1. На init найти encounter manager текущего уровня.
2. Bind на 4 события.
3. При каждом событии обновлять state labels.

---

## 9) Input и Focus правила

1. HUD-виджеты (информирующие) не перехватывают input.
2. Интерактивные окна (инвентарь/меню):
   - явно переключают input mode,
   - возвращают control mode обратно после закрытия.
3. Не ломай L2 click flow (земля/таргет/лут приоритет).

---

## 10) Производительность UI

1. Избегай `Tick` в каждом виджете.
2. Используй invalidate/pooling для списков (status/loot log).
3. Для часто меняющихся чисел обновляй только изменившиеся поля.
4. Для иконок/шрифтов используй единые style assets.

---

## 11) Что выносить в reusable widgets

Рекомендуется сделать отдельные мелкие виджеты:
- `WBP_ValueBar` (HP/MP/Shield)
- `WBP_CooldownSlot`
- `WBP_StatusIcon`
- `WBP_SectionTitle`

Это уменьшает дублирование и упрощает рефакторинг.

---

## 12) Smoke test (обязательный)

1. Войти в PIE, HUD появляется без ошибок.
2. Выбор цели обновляет `TargetFrame`.
3. Урон/лечение обновляют vitals в реальном времени.
4. Ability cast показывает cooldown/disabled корректно.
5. Статусы появляются/исчезают без зависших иконок.
6. Encounter HUD корректно переключает wave/state.
7. Нет compile errors во всех WBP.
8. Нет input conflicts с L2 кликом.

Если все пункты true — UI слой MVP готов.
