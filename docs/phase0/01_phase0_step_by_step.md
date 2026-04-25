# 01. Phase 0 — пошагово и подробно (для джуна)

Phase 0 = техническая подготовка. Здесь мы **не делаем механики**.

---

## Итерация 1 — Создание проекта

1. Запусти Unreal Engine 5.
2. `Games` -> `Third Person` -> `Blueprint`.
3. Выбери папку проекта.
4. Создай проект.
5. Нажми `Play` (PIE) и убедись, что шаблон запускается.

**Результат:** чистый рабочий проект.

---

## Итерация 2 — Плагины

1. `Edit` -> `Plugins`.
2. В поиске включи:
   - Enhanced Input
   - Gameplay Tags
   - Editor Scripting Utilities
   - Blueprint Editor Utilities
3. Нажми `Restart Now`.
4. После перезапуска снова открой Plugins и проверь, что они включены.

**Результат:** необходимые плагины активны.

---

## Итерация 3 — Базовые папки

В Content Browser создай:
- `_Core/Blueprints`
- `_Core/Input`
- `_Core/Data`
- `_Core/UI`
- `_Modules`

В репозитории создай/проверь:
- `docs/phase0`
- `docs/phase1`

**Результат:** структура папок готова и едина для всей команды.

---

## Итерация 4 — Базовые настройки проекта

1. `Project Settings`:
   - проверь, что используешь Enhanced Input.
2. `Maps & Modes`:
   - зафиксируй стартовую карту для разработки.
3. Ничего не оптимизируй на этом этапе (FPS caps, advanced rendering и т.д. оставь дефолт).

**Результат:** стартовые настройки зафиксированы.

---

## Итерация 5 — Naming rules

Создай короткий internal rule list (в README):
- `BP_` (Actor Blueprints)
- `BPC_` (Components)
- `BPI_` (Interfaces)
- `WBP_` (Widgets)
- `DA_` (Data Assets)
- `DT_` (Data Tables)
- `L_` (Levels)

**Результат:** команда не создает ассеты хаотично.

---

## Итерация 6 — Gameplay Tags CSV pipeline

1. Используй готовый файл:
   - `docs/phase0/csv/gameplay_tags_master.csv`
2. В UE: Import CSV как DataTable.
3. Для импорта выбери Row Struct = `GameplayTagTableRow`.
4. `Project Settings` -> `Gameplay Tags` -> `Gameplay Tag Table List` -> добавь импортированную DataTable.
5. Перезапусти редактор.
6. Проверь теги в **Tag Picker**.
   - Что это: выпадающий список тегов в любом поле типа `GameplayTag`/`GameplayTagContainer`.
   - Где посмотреть быстро: открой любой Data Asset с полем `GameplayTag` и нажми на выпадающий список выбора тега.

**Результат:** теги управляются через таблицу, а не вручную.

---

## Итерация 7 — Git baseline

1. Проверь `.gitignore`:
   - `Saved/`
   - `Intermediate/`
   - `DerivedDataCache/`
2. Сделай baseline commit.
3. На чистом pull проверь, что проект открывается.

**Результат:** воспроизводимая стартовая точка.

---

## Что строго запрещено в Phase 0

- Создавать боевую систему.
- Делать таргетинг, AI, инвентарь, урон, квесты.
- Делать «пустые» заготовки компонентов на будущие фазы.

---

## Критерий завершения

Phase 0 закрыта, если:
- проект стабилен;
- структура и правила зафиксированы;
- CSV pipeline для Gameplay Tags работает;
- baseline commit сделан;
- геймплейных механик еще нет.
