## Базовые сведения
- Базовый URL: `http://localhost:<PORT>` (по умолчанию 3000).
- Формат: JSON.
- Ошибки: `{ "message": string, "details": any }`, HTTP-код отражает проблему (`400` валидация, `404` не найдено, `500` сервер).

## Сервисные эндпойнты
### GET /health
Проверка живости сервера.

## Пользователи
### POST /api/users
Создать пользователя.
```json
{
  "username": "alice",
  "balance": 5000
}
```
Ответ `201`: объект пользователя.

### GET /api/users/{userId}
Получить пользователя.

### POST /api/users/{userId}/deposit
Пополнить баланс (ACID-транзакция + запись в `BalanceLedger`).
```json
{ "amount": 1000 }
```
Ответ `200`: обновлённый пользователь.

## Аукционы
### POST /api/auctions
Создать аукцион (фаза 1 — старт).
```json
{
  "title": "Игровая консоль",
  "description": "PS5, новая",
  "startPrice": 10000,
  "bidStep": 500,
  "baseDurationMinutes": 60,
  "startTime": "2026-01-09T12:00:00.000Z",
  "antiSnipeWindowMinutes": 10,
  "antiSnipeExtensionMinutes": 5
}
```
Ответ `201`: созданный аукцион. Если `startTime` в будущем → статус `scheduled`, иначе `active`. `endTime` вычисляется как `startTime + baseDuration`.

### GET /api/auctions
Список аукционов. Параметр `status` (опционально): `scheduled|active|ended`.

### GET /api/auctions/{auctionId}
Получить аукцион. Если `endTime` уже истёк, сервис автоматически финализирует его и вернёт финальное состояние.

### POST /api/auctions/{auctionId}/bids
Сделать ставку (фазы 2–3).
```json
{
  "userId": "65a9...c42",
  "amount": 12000
}
```
Валидации и эффекты:
- ставка ≥ `currentPrice + bidStep`;
- пользователь должен существовать и иметь баланс ≥ суммы ставки;
- при попытке ставки после дедлайна аукцион фиксируется и возвращается ошибка `400`;
- если ставка сделана в последние `antiSnipeWindowMs`, `endTime` увеличивается на `antiSnipeExtensionMs`.

Ответ `201`: созданная ставка.

### GET /api/auctions/{auctionId}/bids
Получить последние 100 ставок по аукциону (по убыванию времени).

### POST /api/auctions/{auctionId}/finalize
Финализировать аукцион вручную (фаза 4). Доступно только если дедлайн прошёл или передан флаг `allowActive=true` на уровне сервиса (используется админ-маршрутом). Создаёт/обновляет запись `Winner`.

## Ставки (альтернативный маршрут)
### POST /api/bids
То же, что `/api/auctions/{auctionId}/bids`, но принимает `auctionId` в теле:
```json
{ "auctionId": "...", "userId": "...", "amount": 12000 }
```

## Админ
### POST /api/admin/auctions/{auctionId}/close
Синоним ручной финализации (использует ту же логику, что `/finalize`).

## Поведение фаз
- **Фаза 1 — старт**: создаются `startPrice`, `bidStep`, базовый таймер, опционально `startTime`.
- **Фаза 2 — активные ставки**: каждая валидная ставка повышает цену.
- **Фаза 3 — анти-снайпинг**: если время до конца ≤ `antiSnipeWindowMs`, `endTime` сдвигается вперёд (обычно 5–10 минут). Ограничений по числу продлений нет.
- **Фаза 4 — завершение**: при наступлении `endTime` и отсутствии новых ставок статус `ended`, победитель фиксируется один раз (`Winner` и поля `winnerUserId/winnerBidId` в аукционе).
