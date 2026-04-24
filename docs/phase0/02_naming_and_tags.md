# 02. Naming + Gameplay Tags (минимум)

## 1) Нейминг
Используй единые префиксы:
- `BP_` — акторы
- `BPC_` — компоненты
- `BPI_` — интерфейсы
- `WBP_` — виджеты
- `DA_` — data assets
- `DT_` — data tables
- `L_` — карты

## 2) Gameplay Tags структура
Минимальные группы:
- `Race.*`
- `ClassLine.*`
- `Profession.*`
- `Skill.*`
- `Status.*`
- `Feature.*`

## 3) CSV формат для импорта
Колонки:
- `RowName`
- `Tag`
- `DevComment`

Готовый файл с базовым набором уже добавлен в репозиторий:
- `docs/phase0/csv/gameplay_tags_master.csv`

Пример:
```csv
RowName,Tag,DevComment
Race_Human,Race.Human,Human race
Skill_Active_PowerStrike,Skill.Active.PowerStrike,Single target hit
Feature_Party,Feature.Party,Party system flag
```

## 4) Импорт в UE
1. Import CSV as DataTable.
2. Row struct: `GameplayTagTableRow`.
3. `Project Settings -> Gameplay Tags -> Gameplay Tag Table List` -> добавь таблицу.
4. Перезапусти редактор.

## 5) Быстрая проверка
- Теги видны в Tag Picker.
- Нет дубликатов `RowName`.
- Нет дубликатов `Tag`.

`Tag Picker` = стандартный выпадающий список выбора тегов в полях `GameplayTag`/`GameplayTagContainer`.
