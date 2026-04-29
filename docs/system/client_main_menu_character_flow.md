# Клиент: главное меню, создание и выбор персонажа

Документ описывает, как клиенту (UI/UX + сетевой слой) работать с backend-контрактами для:
- главного меню,
- создания персонажа,
- выбора активного персонажа.

> Основано на текущих прототипных сервисах `CharacterService` и `MainMenuService` (Python/Node reference).

---

## 1) Цели клиентского потока

1. После логина показать игроку **главное меню аккаунта**.
2. Отобразить:
   - список персонажей,
   - текущего выбранного персонажа,
   - количество занятых/доступных слотов.
3. Дать действия:
   - создать персонажа,
   - выбрать персонажа,
   - войти в мир (если персонаж выбран).

---

## 2) Контракты данных для UI

## 2.1 CharacterSummary

```json
{
  "character_id": "char_1",
  "character_name": "Aerin",
  "character_class": "Mage",
  "level": 1
}
```

## 2.2 MainMenuPayload

```json
{
  "menu": {
    "account_id": "acc_1",
    "characters": [
      {
        "character_id": "char_1",
        "character_name": "Aerin",
        "character_class": "Mage",
        "level": 1
      }
    ],
    "active_character_id": "char_1",
    "max_characters": 3,
    "actions": ["create_character", "select_character", "enter_world"]
  }
}
```

## 2.3 Унифицированный ответ операции

```json
{
  "ok": true,
  "fail_reason": null,
  "message": "",
  "data": {}
}
```

Для JS-референса те же поля в camelCase (`failReason` и т.п.).

---

## 3) Последовательность экранов

## 3.1 После авторизации

1. Клиент вызывает `loadMainMenu(accountId)`.
2. Если `ok=true`:
   - открывает экран «Выбор персонажа»;
   - рендерит `characters`;
   - подсвечивает `active_character_id` (если есть).
3. Если `ok=false`:
   - показывает ошибку по `fail_reason` + `message`;
   - предлагает повторить.

## 3.2 Создание персонажа

1. Игрок открывает модальное окно «Создать персонажа».
2. Поля формы:
   - `character_name` (строка, обязательное),
   - `character_class` (из фиксированного набора: `Warrior`, `Mage`, `Archer`, `Adventurer`).
3. Перед отправкой генерируется `idempotency_key`.
4. Клиент вызывает `createCharacter(accountId, characterName, characterClass, idempotencyKey)`.
5. При успехе:
   - добавляет персонажа в локальный список;
   - закрывает модалку;
   - опционально предлагает сразу выбрать созданного персонажа.
6. При ошибке — показывает причину и не сбрасывает форму.

## 3.3 Выбор персонажа

1. Игрок нажимает «Выбрать» на карточке персонажа.
2. Клиент генерирует `idempotency_key` и вызывает `selectCharacter(accountId, characterId, idempotencyKey)`.
3. При успехе:
   - обновляет `active_character_id`;
   - активирует кнопку «Войти в мир».
4. При ошибке:
   - оставляет предыдущее состояние выбора;
   - показывает toast/баннер с текстом ошибки.

---

## 4) Обработка ошибок в UI

Рекомендуемая маппинга `fail_reason` -> клиентское сообщение:

- `NOT_FOUND`:
  - «Аккаунт или персонаж не найден. Обновите меню.»
- `MISSING_DATA_PROFILE`:
  - «Проверьте имя или класс персонажа.»
- `INTERNAL_STATE_CONFLICT`:
  - «Операция не может быть выполнена (лимит слотов / имя занято).»
- `IDEMPOTENCY_CONFLICT`:
  - «Повторите действие: ключ запроса конфликтует с другой операцией.»

Важно: показывать пользователю дружелюбный текст, а техническую причину логировать отдельно.

---

## 5) Idempotency: требования к клиенту

1. На каждую мутацию (`createCharacter`, `selectCharacter`) отправлять `idempotency_key`.
2. Если запрос ретраится из-за сети, использовать **тот же ключ**.
3. Если пользователь запускает новое действие — генерировать **новый ключ**.
4. Формат ключа (пример):
   - `menu:create:<uuid>`
   - `menu:select:<uuid>`

---

## 6) Локальное состояние клиента (минимум)

```ts
type MainMenuState = {
  accountId: string;
  characters: CharacterSummary[];
  activeCharacterId: string | null;
  maxCharacters: number;
  loading: boolean;
  error: string | null;
};
```

Рекомендуется хранить это состояние в одном store (Redux/Zustand/Pinia и т.д.) и обновлять его только через action-слой.

---

## 7) UX-рекомендации

1. На экране списка отображать:
   - имя,
   - класс,
   - уровень,
   - пометку «Выбран».
2. Кнопка «Создать персонажа» блокируется, когда `characters.length >= max_characters`.
3. Кнопка «Войти в мир» активна только при наличии `active_character_id`.
4. При создании/выборе показывать loading-state на конкретной кнопке, а не на всём экране.
5. После ошибки оставлять пользователя на текущем экране без потери данных формы.

---

## 8) Минимальный псевдокод клиентского слоя

```ts
async function loadMainMenu(accountId: string) {
  setState({ loading: true, error: null });
  const res = await api.mainMenu(accountId);
  if (!res.ok) return setState({ loading: false, error: mapFail(res) });

  setState({
    loading: false,
    accountId: res.data.menu.account_id,
    characters: res.data.menu.characters,
    activeCharacterId: res.data.menu.active_character_id,
    maxCharacters: res.data.menu.max_characters,
    error: null,
  });
}

async function createCharacter(accountId: string, name: string, clazz: string) {
  const key = `menu:create:${crypto.randomUUID()}`;
  const res = await api.createCharacter(accountId, name, clazz, key);
  if (!res.ok) throw new Error(mapFail(res));
  await loadMainMenu(accountId);
}

async function selectCharacter(accountId: string, characterId: string) {
  const key = `menu:select:${crypto.randomUUID()}`;
  const res = await api.selectCharacter(accountId, characterId, key);
  if (!res.ok) throw new Error(mapFail(res));
  setState({ activeCharacterId: characterId });
}
```

---

## 9) Definition of Done (для клиента)

- [ ] Главное меню открывается после логина.
- [ ] Список персонажей рендерится корректно.
- [ ] Создание персонажа работает и обновляет список.
- [ ] Выбор персонажа сохраняется в UI.
- [ ] Кнопка «Войти в мир» зависит от выбранного персонажа.
- [ ] Ошибки и ретраи обрабатываются корректно.
- [ ] Idempotency keys отправляются на все мутации.
