# 01. Игровой мир: ландшафт, локации и бесплатные ассеты

Цель: быстро собрать играбельный открытый мир (не L2-копию), но с похожей MMORPG-концепцией: стартовая безопасная зона -> переходные территории -> опасные high-level зоны -> инстансные точки интереса.

---

## 1) Концепт мира (отличный от L2)

## Название
**Shattered Frontier**

## Идея
Мир после магического катаклизма: несколько биомов соединены «разломами», которые дают естественную прогрессию сложности.

## Биомы / локации
1. **Haven Basin** (старт)
   - спокойные равнины, крафт/обучение, низкоуровневые мобы
2. **Ash Dunes** (mid)
   - пустыня/каньоны, элитные патрули, редкие ресурсы
3. **Frostbreak Ridge** (mid-high)
   - снежные хребты, AoE-опасности, сильные ranged NPC
4. **Verdant Ruins** (high)
   - лес + руины, вертикальный геймплей, сложные encounter waves
5. **The Fracture Core** (endgame pocket zone)
   - компактные «разломные» арены под боссов/ивенты

---

## 2) Как собрать мир по шагам (UE5)

## Step A — Базовый ландшафт
1. Создай persistent level: `LV_World_Main`.
2. Включи World Partition (если нужен большой мир).
3. Раздели мир на 4–5 регионов (по биомам).
4. Для каждого региона:
   - отдельный landscape layer;
   - отдельный material instance;
   - отдельные foliage presets.

## Step B — Логическая навигация
1. Проложи «дороги»/коридоры между биомами.
2. Размести safe hubs на стыках регионов.
3. Добавь travel точки:
   - gate stones,
   - телепорты,
   - world-event входы.

## Step C — Encounter layout
1. Для каждой зоны назначь tier сложности.
2. Разметь encounter pockets (по Phase 14):
   - patrol routes,
   - ambush points,
   - boss площадки.
3. Свяжи с `BP_EncounterManager` профилями волн.

## Step D — Вертикальность и читаемость
1. Добавь высотные точки для обзора.
2. Раздели POI по silhouette (руины, башни, скалы).
3. Используй контраст освещения между зонами (день/сумерки/туман).

---

## 3) Бесплатные ассеты (проверенные источники)

Ниже — источники с бесплатным контентом для UE и worldbuilding.
Перед использованием всегда перепроверь условия лицензии на конкретной странице ассета.

## A) Unreal / Fab
1. **Landscapes Pack (Free)**
   - https://www.fab.com/listings/c6a8fa58-84f1-4bb8-935d-a3467e9fe58d
   - Подходит для быстрого старта по биомам (горы/снег/пустыня/трава).

2. **Fab Unreal Engine Free channel**
   - https://www.fab.com/channels/unreal-engine?is_free=1
   - Фильтруй `Environments`, `Vegetation`, `Props`, `VFX`.

## B) Quixel Megascans (для UE)
1. **Bridge by Quixel (официально)**
   - https://www.unrealengine.com/en-US/bridge
   - На странице указано, что Megascans assets free for use with Unreal Engine.

## C) CC0 библиотеки (безопасные для прототипа)
1. **Poly Haven (HDRI / Textures / Models)**
   - Каталог: https://polyhaven.com/
   - Лицензия (CC0): https://polyhaven.com/license

2. **ambientCG (PBR материалы и модели)**
   - Каталог: https://ambientcg.com/
   - Лицензия (CC0): https://docs.ambientcg.com/license/

3. **Kenney Nature Kit (CC0)**
   - https://kenney.nl/assets/nature-kit

## D) Epic free content (проверять доступность в Launcher/Fab)
1. **Infinity Blade assets (исторически free от Epic)**
   - Announcement: https://www.unrealengine.com/blog/epic-releases-4-million-of-infinity-blade-assets-and-renews-featured-free-unreal-engine-marketplace-content

---

## 4) Рекомендуемый набор ассетов под этот мир

## Минимальный набор
1. Landscape base pack (из Fab free)
2. Megascans rocks + cliffs + surfaces
3. Foliage set (деревья/кусты/трава)
4. Ruins/structures modular pack
5. Sky/HDRI + weather fx

## Расклад по биомам
- Haven Basin: grass + деревни + мягкий свет
- Ash Dunes: desert materials + windsand fx
- Frostbreak Ridge: snow materials + ледяные decals
- Verdant Ruins: dense foliage + ruin modules
- Fracture Core: аномальные VFX + emissive props

---

## 5) Тех. правила сборки мира

1. Сначала greybox маршрутов, потом арт-детализация.
2. Все крупные зоны — через HLOD/Nanite-готовые меши.
3. Foliage density контролируй по performance budget.
4. Освещение: один master setup + пер-зональные overrides.
5. Для POI обязательно gameplay purpose (не только декор).

---

## 6) QA чек перед production

- [ ] Лицензии на все внешние ассеты сохранены в проектной вики
- [ ] По каждой зоне есть понятный gameplay intent
- [ ] Навигация между зонами читается без UI map-spam
- [ ] Encounter точки покрывают progression по сложности
- [ ] World streaming не вызывает видимых pop-in критичных объектов
- [ ] FPS budget соблюден в целевых локациях

---

## 7) Что делать дальше (практический порядок)

1. Собрать `LV_World_Main` с 2 биомами (Haven + Ash) как vertical slice.
2. Подключить 1 полный encounter flow (waves + role NPC).
3. Прогнать smoke + perf pass.
4. Масштабировать на Frostbreak/Verdant/Fracture.

