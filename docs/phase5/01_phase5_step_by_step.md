# 01. Phase 5 — HP / смерть / респавн (подробно по нодам)

Фаза 5 начинается после закрытой Phase 4 (базовая атака уже есть).

---

## Итерация 1 — ассеты

Создай:
- `Content/_Core/Blueprints/Components/BPC_Health`
- `Content/_Core/Blueprints/Structs/S_RespawnPoint` (опционально)

Обнови:
- `BPI_Damageable` (если нужно унифицировать сигнатуру)
- `BP_PlayerCharacter`
- `BP_EnemyBase` (или текущий вражеский класс)

---

## Итерация 2 — переменные и события `BPC_Health`

## Переменные
1. `MaxHP` (`float`, default `100`)
2. `CurrentHP` (`float`, default `100`)
3. `bIsDead` (`bool`, default `false`)
4. `RespawnDelay` (`float`, default `5.0`)
5. `bAutoRespawn` (`bool`, default `true`)
6. `OwnerActor` (`Actor` ref)
7. `SpawnTransform` (`Transform`)

## Dispatchers
- `OnHPChanged(CurrentHP float, MaxHP float)`
- `OnDeath(Killer Actor)`
- `OnRespawned()`

## Функции
1. `InitializeHealth`
2. `ApplyDamage`
3. `ApplyHeal`
4. `Die`
5. `Respawn`
6. `SetHP`

---

## Итерация 3 — `InitializeHealth` (node-by-node)

1. `Get Owner` -> `Set OwnerActor`
2. `GetActorTransform` (OwnerActor) -> `Set SpawnTransform`
3. `Set CurrentHP = MaxHP`
4. `Set bIsDead = false`
5. `Call OnHPChanged(CurrentHP, MaxHP)`

BeginPlay компонента:
1. Event `BeginPlay`
2. `InitializeHealth`

---

## Итерация 4 — `SetHP` (node-by-node)

1. Input: `NewHP` (`float`)
2. `Clamp (float)`:
   - Value = `NewHP`
   - Min = `0`
   - Max = `MaxHP`
3. `Set CurrentHP`
4. `Call OnHPChanged(CurrentHP, MaxHP)`

---

## Итерация 5 — `ApplyDamage` (node-by-node)

Inputs:
- `DamageAmount` (`float`)
- `InstigatorActor` (`Actor`)
Output:
- `ActualDamage` (`float`)

Ноды:
1. `Branch` (`bIsDead`)
   - True -> Return `0`
2. `Max` (`DamageAmount`, `0`)
3. `Set LocalDamage`
4. `CurrentHP - LocalDamage`
5. `Call SetHP(result)`
6. `Set ActualDamage = LocalDamage`
7. `<=` (`CurrentHP`, `0`) -> `Branch`
   - True -> `Call Die(InstigatorActor)`
8. Return `ActualDamage`

---

## Итерация 6 — `ApplyHeal` (node-by-node)

1. Input `HealAmount`
2. `Branch` (`bIsDead`)
   - True -> Return
3. `Max(HealAmount, 0)`
4. `CurrentHP + HealAmount`
5. `Call SetHP(result)`

---

## Итерация 7 — `Die` (node-by-node)

Input:
- `KillerActor`

Ноды:
1. `Branch` (`bIsDead`)
   - True -> Return
2. `Set bIsDead = true`
3. `Call OnDeath(KillerActor)`
4. `Set Actor Enable Collision` (OwnerActor, false)
5. Если OwnerCharacter:
   - `Cast To Character` (разово)
   - `Disable Movement` (CharacterMovement)
6. `Branch` (`bAutoRespawn`)
   - True -> `Set Timer by Function Name` (`Respawn`, `RespawnDelay`, Looping=false)

---

## Итерация 8 — `Respawn` (node-by-node)

1. `SetActorTransform` (OwnerActor, SpawnTransform)
2. `Set Actor Enable Collision` (true)
3. Если OwnerCharacter:
   - `Set Movement Mode` = Walking
4. `Set bIsDead = false`
5. `Set CurrentHP = MaxHP`
6. `Call OnHPChanged(CurrentHP, MaxHP)`
7. `Call OnRespawned()`

---

## Итерация 9 — интеграция с `BPI_Damageable`

На акторе цели (`BP_EnemyBase`, `BP_PlayerCharacter` если PvP позже):

### Реализация `ApplyDamageBP`
1. `Get BPC_Health`
2. `Call ApplyDamage(DamageAmount, InstigatorActor)`
3. Return `ActualDamage`

---

## Итерация 10 — интеграция с `BPC_CombatBasic`

Проверь, что `TryBasicAttack` бьет через `BPI_Damageable`.

На этом этапе ничего не меняем в формуле урона — только проверяем:
- HP уменьшается
- на 0 вызывается смерть
- по таймеру респавн

---

## Итерация 11 — UI минимум (опционально, но полезно)

1. Подпишись на `OnHPChanged`.
2. Обновляй полоску HP цели или debug-текст.
3. Подпишись на `OnDeath`/`OnRespawned` для статусов.

---

## Итерация 12 — финальный smoke test

1. Бьем цель -> HP уменьшается.
2. HP доходит до 0 -> цель умирает.
3. Коллизия отключается при смерти.
4. Через `RespawnDelay` цель появляется снова с полным HP.
5. После респавна цель снова получает урон корректно.
6. Нет compile errors в:
   - `BPC_Health`
   - `BPI_Damageable` реализациях
   - `BPC_CombatBasic` интеграции

Если все пункты true — Phase 5 закрыта.
