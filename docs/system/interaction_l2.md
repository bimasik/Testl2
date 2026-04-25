# L2 Interaction System (единый стандарт)

Этот документ задает единую interaction-модель, которую используют все фазы.

## 1) Основной принцип
Одна кнопка (`LMB`) выполняет контекстное действие:
1. Клик по земле -> Move.
2. Клик по NPC/мобу/игроку:
   - первый клик: select target;
   - повторный клик: execute action (attack/interact/follow по контексту).
3. Клик по world loot -> pickup.

## 2) Очередность обработки клика (приоритет)
При получении `LMB`:
1. Если под курсором loot actor -> `Pickup`.
2. Иначе если под курсором targetable actor:
   - если это новая цель -> `SetTarget`;
   - если уже выбранная цель -> `ExecuteTargetAction`.
3. Иначе (земля/navmesh) -> `MoveToLocation`.

## 3) Что такое ExecuteTargetAction
- Если цель враждебная -> start basic attack.
- Если цель friendly NPC -> interact/talk.
- Если цель объект -> use/open.

## 4) Ограничения текущего этапа
- В ранних фазах можно отключать часть веток (например talk/use), но порядок приоритета сохраняется.
- Нельзя добавлять отдельную «action-кнопку», которая конфликтует с L2 click-циклом.

## 5) Состояния таргета
- `NoTarget`
- `TargetSelected`
- `TargetAction`

Переходы:
- `NoTarget` + click target -> `TargetSelected`
- `TargetSelected` + click same target -> `TargetAction`
- `TargetSelected` + click another target -> `TargetSelected` (new target)
- `Esc` -> `NoTarget`
