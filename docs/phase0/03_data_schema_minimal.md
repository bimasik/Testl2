# 03. Минимальная схема данных (без хлама)

Этот файл специально короткий: только то, что реально нужно на старте.

## 1) Структуры

## `S_StatBlock`
Разделяем по группам:
- Primary: STR, DEX, CON, INT, WIT, MEN
- Resource: MaxHP, MaxMP
- Combat: PAtk, PDef, MAtk, MDef, Accuracy, Evasion, CritChance
- Movement: MoveSpeed

> Для L2-like в RPG-статах достаточно `MoveSpeed`.

## `S_RequirementRule`
- RequiredTags
- ForbiddenTags
- MinLevel
- RequiredProfessionTags

## `S_StatModifier`
- TargetStatTag
- Mode (Add/Multiply/Override)
- Value

## 2) Data Assets
- `DA_Race`
- `DA_ClassLine`
- `DA_Profession`
- `DA_Skill`

## 3) Data Tables
- `DT_ExpByLevel`

## 4) Принцип
Сначала делаем минимально рабочую схему.
Расширяем только когда появляется реальная потребность в фазе разработки.
