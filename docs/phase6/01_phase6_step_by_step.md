# 01. Phase 6 — базовый NPC AI бой (подробно по нодам)

Фаза 6 начинается после закрытой Phase 5 (HP/смерть/респавн уже есть).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_NPCAICombat`
- `Content/_Core/Blueprints/AI/BT_EnemyBasic` (опционально, если через BT)

На этой фазе можно сделать без BT, чисто в компоненте.

Обнови:
- `BP_EnemyBase`

---

## Итерация 2 — переменные `BPC_NPCAICombat`

1. `OwnerCharacter` (`Character` ref)
2. `OwnerController` (`AIController` ref)
3. `TargetActor` (`Actor` ref)
4. `SpawnLocation` (`Vector`)
5. `AggroRadius` (`float`, default `1200`)
6. `LoseTargetRadius` (`float`, default `1600`)
7. `AttackRange` (`float`, default `220`)
8. `LeashRadius` (`float`, default `2000`)
9. `AttackInterval` (`float`, default `1.4`)
10. `LastAttackTime` (`float`, default `-999`)
11. `CurrentState` (`Enum EEnemyAIState`)

`EEnemyAIState`:
- `Idle`
- `Chase`
- `Attack`
- `Return`

## Функции
1. `InitializeReferences`
2. `TryAcquireTarget`
3. `UpdateState`
4. `HandleIdle`
5. `HandleChase`
6. `HandleAttack`
7. `HandleReturn`
8. `ClearTarget`

---

## Итерация 3 — `InitializeReferences` (node-by-node)

1. `Get Owner`
2. `Cast To Character`
3. `Set OwnerCharacter`
4. `Get Controller`
5. `Cast To AIController`
6. `Set OwnerController`
7. `GetActorLocation` (OwnerCharacter)
8. `Set SpawnLocation`
9. `Set CurrentState = Idle`

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeReferences`

---

## Итерация 4 — `TryAcquireTarget` (node-by-node)

## Цель
Найти игрока в `AggroRadius`.

1. `SphereOverlapActors`
   - Center = `OwnerCharacter.Location`
   - Radius = `AggroRadius`
   - ObjectTypes = Pawn
2. `ForEachLoop` по актерам
3. На каждом:
   - `Does Implement Interface BPI_Targetable` (опционально)
   - фильтр: это игрок
4. Выбери ближайшего
5. `Set TargetActor`
6. Если target найден -> `Set CurrentState = Chase`

---

## Итерация 5 — `UpdateState` (node-by-node)

Вызывается таймером (например, каждые 0.2 сек).

1. `Switch on EEnemyAIState`
2. `Idle` -> `HandleIdle`
3. `Chase` -> `HandleChase`
4. `Attack` -> `HandleAttack`
5. `Return` -> `HandleReturn`

### Таймер запуска
- BeginPlay -> `Set Timer by Function Name`
  - Function = `UpdateState`
  - Time = `0.2`
  - Looping = true

---

## Итерация 6 — `HandleIdle` (node-by-node)

1. `Call TryAcquireTarget`
2. Если цели нет -> ничего (стоим)

---

## Итерация 7 — `HandleChase` (node-by-node)

1. `IsValid(TargetActor)` -> Branch
   - False -> `Set CurrentState = Return`
2. `Distance` до `TargetActor`
3. Если `Distance > LoseTargetRadius` -> `ClearTarget` + `Set CurrentState = Return`
4. Если `Distance <= AttackRange` -> `Set CurrentState = Attack`
5. Проверка leash:
   - Distance от `OwnerCharacter` до `SpawnLocation`
   - Если `> LeashRadius` -> `ClearTarget` + `Set CurrentState = Return`
6. Иначе `AI MoveTo` (TargetActor)

---

## Итерация 8 — `HandleAttack` (node-by-node)

1. `IsValid(TargetActor)` -> Branch
   - False -> `Set CurrentState = Return`
2. `Distance` до цели
3. Если `Distance > AttackRange` -> `Set CurrentState = Chase`
4. Cooldown check:
   - `Now = GetGameTimeInSeconds`
   - `Now - LastAttackTime >= AttackInterval`
5. Если true:
   - Вызвать у NPC `BPC_CombatBasic.TryBasicAttack` (если есть)
   - `Set LastAttackTime = Now`

---

## Итерация 9 — `HandleReturn` (node-by-node)

1. `AI MoveTo Location` (`SpawnLocation`)
2. `Distance` до `SpawnLocation`
3. Если `Distance <= 80`:
   - `Set CurrentState = Idle`
   - `ClearTarget`

---

## Итерация 10 — `ClearTarget` (node-by-node)

1. `Set TargetActor = None`
2. Если `BPC_Targeting` на NPC есть -> `ClearTarget`

---

## Итерация 11 — интеграция в `BP_EnemyBase`

1. Add Component -> `BPC_NPCAICombat`
2. Add Component -> `BPC_Health` (из Phase 5)
3. Add Component -> `BPC_CombatBasic` (если атака идет через него)

На `OnDeath`:
- выставь `CurrentState = Idle`
- останови move (`StopMovement`)
- очисти target

На `OnRespawned`:
- восстанови `SpawnLocation` (если нужно)
- `CurrentState = Idle`

---

## Итерация 12 — финальный smoke test

1. Игрок входит в `AggroRadius` -> NPC начинает преследование.
2. На дистанции атаки NPC бьет игрока.
3. Если игрок убегает за `LoseTargetRadius` или `LeashRadius`, NPC возвращается домой.
4. После возврата NPC снова в `Idle`.
5. После смерти/респавна NPC цикл работает снова.
6. Нет compile errors в:
   - `BPC_NPCAICombat`
   - `BP_EnemyBase`
   - связанные `BPC_Health` / `BPC_CombatBasic`

Если все пункты true — Phase 6 закрыта.
