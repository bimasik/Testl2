# 01. Phase 4 — базовая атака (подробно по нодам)

Фаза 4 начинается после закрытой Phase 3 (таргетинг уже работает).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_CombatBasic`
- `Content/_Core/Blueprints/Interfaces/BPI_Damageable`
- `Content/_Core/Input/IA_BasicAttack`

Обнови:
- `IMC_PlayerBase`

## `IA_BasicAttack`
- Value Type: `Digital`
- Trigger: `Pressed`
- Mapping: `F` (или ЛКМ по выбранной цели в отдельной ветке позже)

Добавь mapping в `IMC_PlayerBase`.

---

## Итерация 2 — интерфейс `BPI_Damageable`

Добавь функцию:
- `ApplyDamageBP`
  - Inputs:
    - `DamageAmount` (`float`)
    - `InstigatorActor` (`Actor`)
  - Output:
    - `ActualDamage` (`float`)

---

## Итерация 3 — подготовка цели для урона

На таргетируемых акторах (например `BP_EnemyBase`) реализуй:
- `BPI_Targetable` (уже из Phase 3)
- `BPI_Damageable`

Минимальная реализация `ApplyDamageBP` на этой фазе:
1. Внутренний `CurrentHP` уменьшаем на `DamageAmount`.
2. Clamp до `0`.
3. Возвращаем `ActualDamage`.

> Полноценный `BPC_Health` делаем в следующей фазе. Здесь только минимальный урон для проверки боевого цикла.

---

## Итерация 4 — `BPC_CombatBasic` (переменные и функции)

## Переменные
1. `OwnerCharacter` (`Character` ref)
2. `TargetingComponent` (`BPC_Targeting` ref)
3. `BaseDamage` (`float`, default `10`)
4. `AttackRange` (`float`, default `220`)
5. `AttackCooldown` (`float`, default `1.2`)
6. `LastAttackTime` (`float`, default `-999`)

## Функции
1. `InitializeReferences`
2. `CanAttackCurrentTarget` -> `bool`
3. `TryBasicAttack`
4. `IsInRange` (`Target Actor`) -> `bool`

---

## Итерация 5 — `InitializeReferences` (node-by-node)

1. `Get Owner`
2. `Cast To Character`
3. `Set OwnerCharacter`
4. `Get Component By Class` (`BPC_Targeting`)
5. `Set TargetingComponent`

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeReferences`

---

## Итерация 6 — `IsInRange` (node-by-node)

1. `IsValid(Target)` -> `Branch`
2. `GetActorLocation` (`OwnerCharacter`)
3. `GetActorLocation` (`Target`)
4. `Vector Distance`
5. `<=` (`AttackRange`)
6. Return bool

---

## Итерация 7 — `CanAttackCurrentTarget` (node-by-node)

1. `IsValid(TargetingComponent)` -> `Branch`
2. `Get CurrentTarget` (из `TargetingComponent`)
3. `IsValid(CurrentTarget)` -> `Branch`
4. `Does Implement Interface` (`BPI_Damageable`) -> `Branch`
5. `Call IsInRange(CurrentTarget)` -> `Branch`
6. `Get Game Time in Seconds`
7. `Now - LastAttackTime`
8. `>= AttackCooldown` -> Return bool

---

## Итерация 8 — `TryBasicAttack` (node-by-node)

1. `Call CanAttackCurrentTarget` -> `Branch`
2. False -> `Return`
3. True:
   - `Get CurrentTarget` (из `TargetingComponent`)
   - `ApplyDamageBP` (Message, Target=CurrentTarget)
     - DamageAmount = `BaseDamage`
     - InstigatorActor = `OwnerCharacter`
   - `Get Game Time in Seconds`
   - `Set LastAttackTime`

---

## Итерация 9 — подключение в `BP_PlayerCharacter`

1. Add Component -> `BPC_CombatBasic`
2. Event `IA_BasicAttack (Started)`:
   - `Get BPC_CombatBasic`
   - `Call TryBasicAttack`

---

## Итерация 10 — L2-правило старта автоатаки (в рамках Phase 4)

На этой фазе базовое L2-правило:
1. 1-й клик по цели = select target (из Phase 3).
2. 2-й клик по той же цели = `TryBasicAttack` (start target action).

Дополнительно оставляем debug-кнопку `IA_BasicAttack` для тестов.

Не делаем пока:
- непрерывный auto-attack loop;
- chase до цели, если вне range;
- боевые станы/касты/скиллы.

---

## Итерация 11 — финальный smoke test

1. Выбери цель через Phase 3.
2. Нажми `F` -> цель получает урон.
3. Атака не проходит, если цель не выбрана.
4. Атака не проходит, если цель вне range.
5. Cooldown блокирует спам.
6. Нет compile errors в:
   - `BPC_CombatBasic`
   - `BPI_Damageable`
   - `BP_PlayerCharacter`

Если все пункты true — Phase 4 закрыта.
