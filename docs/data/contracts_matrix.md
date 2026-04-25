# Contracts Matrix (Phase 0–14)

Матрица фиксирует, какие подсистемы читают/пишут ключевые структуры и таблицы.
Цель: убрать неявные зависимости и упростить рефакторинг.

## Принципы
1. Любая структура/DT имеет владельца (source of truth).
2. Остальные системы только читают через публичный API владельца.
3. Изменение контракта требует обновления `SchemaVersion`.

---

## 1) Inventory / Equipment

| Контракт | Владелец | Пишут | Читают | Notes |
|---|---|---|---|---|
| `S_InventoryItem` | `BPC_Inventory` | `BPC_Inventory` | UI, `BPC_Equipment` | Изменения через транзакции |
| `S_EquippedItem` | `BPC_Equipment` | `BPC_Equipment` | UI, stats/visual sync | Sync через `RebuildEquipmentState` |
| `DT_ItemEquipmentProfile` | Data layer | Design tools | `BPC_Equipment` | Обязателен pre-flight validate |

## 2) Ability / Status / Combat

| Контракт | Владелец | Пишут | Читают | Notes |
|---|---|---|---|---|
| `S_AbilitySpec` | `BPC_AbilitySystem` | grant/init flow | UI, AI | Runtime state отдельно |
| `S_AbilityRuntimeState` | `BPC_AbilitySystem` | cast/cooldown flow | UI | Не хранить в UI логику |
| `S_StatusEffectSpec` | `BPC_StatusEffects` | apply flow | UI, AI constraints | Data-driven из DT |
| `S_StatusEffectRuntime` | `BPC_StatusEffects` | tick/remove flow | UI | Cleanup обязателен |
| `DT_AbilityCatalog` | Data layer | Design tools | `BPC_AbilitySystem`, AI | Проверка диапазонов |
| `DT_StatusEffectsCatalog` | Data layer | Design tools | `BPC_StatusEffects`, abilities | Приоритеты/стеки |

## 3) AI / Encounter

| Контракт | Владелец | Пишут | Читают | Notes |
|---|---|---|---|---|
| `S_ThreatEntry` | `BPC_AIThreat` | damage/proximity events | `BPC_AIUtility` | decay/reconcile |
| `S_UtilityAction` | `BPC_AIUtility` | profile init | utility loop | score нормализуется |
| `S_WaveEntry` | `BP_EncounterManager` | encounter flow | HUD/debug | Запуск по wave index |
| `S_EncounterConfig` | `BP_EncounterManager` | load profile | orchestration systems | Reset/Abort fail-safe |
| `DT_AIUtilityProfiles` | Data layer | Design tools | `BPC_AIUtility` | role modifiers |
| `DT_EncounterProfiles` | Data layer | Design tools | `BP_EncounterManager` | spawn rules |

---

## SchemaVersion policy
- Для критичных структур добавляется `SchemaVersion` (`int`).
- Любое несовместимое изменение:
  1. повышает версию,
  2. фиксируется в changelog контракта,
  3. сопровождается миграцией данных/DT.
