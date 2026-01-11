Telegram Gift Auctions – backend + demo UI
==========================================

Ниже — полный набор шагов и файлов, чтобы быстро поднять демо, понять архитектуру (Clean Architecture + FSD + Atomic) и дергать API.

## План из 7 блоков (как в ТЗ)
1) API слоя: `src/api/routes/auction.routes.ts`, `src/api/controllers/AuctionController.ts` — CRUD по аукционам и ставкам (mock user).
2) HTTP-клиент: `client/src/shared/api/client.ts` — единая точка fetch + базовый URL.
3) Entities (модель): `client/src/entities/auction/model/types.ts` — типы аукциона/ставки/DTO.
4) Shared UI (atomic atoms): `shared/ui/status-badge`, `shared/ui/loader`, `shared/ui/error-box`.
5) Widgets (atomic molecules): `widgets/auction-card` — карточка аукциона для списков.
6) Pages (FSD features):
   - `pages/HomePage.tsx` — список аукционов + CTA.
   - `pages/CreateAuctionPage.tsx` — форма создания.
   - `pages/AuctionPage.tsx` — детали, ставки, таймер, форма ставки, авто-поллинг.
7) App shell: `app/App.tsx`, `app/index.css`, `main.tsx` — роутинг, базовый layout, глобальные стили.

## Ключевые файлы и роли
- `src/index.ts` — точка входа backend, mounts `/auctions`, health-check.
- `src/api/routes/auction.routes.ts` — маршруты `GET/POST /auctions`, `POST /auctions/:id/bids`.
- `src/api/controllers/AuctionController.ts` — валидация DTO, вызовы сервисов, маппинг ошибок.
- `client/src/main.tsx` — создаёт React app, прокидывает Router.
- `client/src/app/App.tsx` — layout, навигация, маршруты UI.
- `client/src/app/index.css` — базовые токены/стили.
- `client/src/entities/auction/model/types.ts` — типы домена и DTO UI.
- `client/src/entities/auction/api/auctionApi.ts` — обёртки над REST (getAll, getById, create, placeBid).
- `client/src/shared/api/client.ts` — fetch с базовым URL и общими заголовками.
- `client/src/shared/ui/*` — атомы (loader, error-box, status-badge).
- `client/src/widgets/auction-card` — карточка аукциона для листинга.
- `client/src/pages/HomePage.tsx` — список аукционов, лоадер/ошибка/пустой стейт.
- `client/src/pages/CreateAuctionPage.tsx` — форма создания, disable на submit, success→redirect.
- `client/src/pages/AuctionPage.tsx` — детали, таймер раунда, список ставок, форма ставки, автообновление (poll ~4s).

## Запуск backend
1. Переменные окружения (пример):
```
MONGO_URL=mongodb://localhost:27017/auction_db?replicaSet=rs0
REDIS_URL=redis://localhost:6379
PORT=3000
```
2. Поднять инфраструктуру (опционально):
```
docker compose up -d
```
3. Установить пакеты и запустить dev:
```
npm ci
npm run dev
```
Сервер: `http://localhost:3000`.

## Запуск frontend
```
cd client
npm install
npm run dev
```
UI: `http://localhost:5173`.

### Запуск через Docker Compose (backend + frontend + mongo + redis)
```
docker compose down -v
docker compose up --build
```
- Backend: http://localhost:3001 (внутри сети — `http://backend:3000`)
- Frontend (prod build, serve): http://localhost:4174
- MongoDB: хост-порт 27018 (внутри сети 27017), Redis: хост-порт 6380 (внутри сети 6379)
ENV по умолчанию: `MONGO_URL=mongodb://mongodb:27017/auction_db?replicaSet=rs0`, `REDIS_URL=redis://redis:6379`, `ADMIN_TOKEN=admin`, `VITE_API_BASE=http://localhost:3001` (подшивается в фронтовый билд).

API base для UI берётся из `VITE_API_BASE` (по умолчанию `/api`, в dev проксируется на `http://localhost:3000` через Vite). Если backend на другом хосте/порту — задайте, например:
```
VITE_API_BASE=http://localhost:3000
```

## Маршруты API
- `GET /auctions` — список аукционов.
- `GET /auctions/:id` — аукцион + ставки.
- `POST /auctions` — создать аукцион:
```
{
  "title": "Gift #1",
  "description": "demo",
  "startingPrice": 10,
  "minBidStep": 1,
  "roundDurationSeconds": 60,
  "maxParticipantsPerRound": 10
}
```
- `POST /auctions/:id/bids` — сделать ставку (mock user `demo-user`):
```
{ "amount": 15 }
```

## Поведение UI
- `/` — список, статусы, минимальные данные, кнопка «Open» и «Create Auction».
- `/create` — форма создания, disable на submit, success/err, redirect на созданный аукцион (есть опциональный лимит ставок ботов).
- `/auctions/:id` — детали, статус, текущий раунд, таймер, список ставок, форма ставки, авто-поллинг каждые ~4s.
- `/profile` — кошелёк: привязка платёжки (card/crypto), депозиты, балансы wallet/held/prize.
- `/transactions` — просмотр транзакций (фильтр по user).

## Админ-панель и боты
- UI: `/admin` — управление ботами (без токена в демо-режиме).
- Настройки: `enabled`, количество ботов, задержки между ставками, окно анти-снайпа, лимит `maxBidAmount` (боты не ставят выше).
- Бэкенд: `POST /admin/login`, `GET/POST /admin/bots`.
- Сервис ботов: `src/services/BotService.ts` — держит интервалы и случайные ставки `bot-{id}`.
- Bot API keys: `/bot-api` (list/create/revoke), пример ставок бота по `X-API-Key` — `POST /bot-api/bid { auctionId, amount }`.
- Транзакции: `/transactions` (GET, фильтры user/type/limit).

## Нагрузочные и бот-скрипты (Node 18+)
- `scripts/bots/bid-bot.ts` — простые боты. Запуск: `API_BASE=http://localhost:3000 BOTS=5 ts-node scripts/bots/bid-bot.ts`.
- `scripts/bots/sniper-bot.ts` — "снайпер", ставит с задержкой. Запуск: `ts-node scripts/bots/sniper-bot.ts`.
- `scripts/load/run-load-test.ts` — создаёт несколько аукционов и шлёт ставки. Запуск: `API_BASE=http://localhost:3000 ts-node scripts/load/run-load-test.ts`.

## Анти-снайп и таймер
- Модель аукциона теперь имеет `endsAt`, `antiSnipeWindowSeconds`, `antiSnipeExtendSeconds`.
- При ставке, если до конца меньше окна — `endsAt` продлевается на `antiSnipeExtendSeconds`.
- UI показывает таймер и параметры анти-снайпа.

## Оплата и холды (mock, через Mongo)
- Пользователь должен привязать платёжный метод: `POST /users/link` `{ username, type: card|crypto, masked }`.
- Пополнение: `POST /users/deposit` `{ username, amount }` — увеличивает `balance`.
- При ставке создаётся hold (`heldBalance` и запись в `BalanceLedger`), предыдущему лидеру hold освобождается. Для ботов автоплатёжка и авто-пополнение.
- Если баланс < суммы — ставка отклоняется.
- Призы: при финализации победителю списывается hold и начисляется `prizeBalance`.
- Транзакции-аудит: DEPOSIT/LINK/HOLD/RELEASE/CHARGE/PRIZE/BOT_FUND.

## Завершение аукциона (финализация)
- Endpoint: `POST /auctions/:id/finalize` — отмечает аукцион завершённым.
- Логика: берётся последняя ставка; если её нет — просто `FINISHED`. Если есть — `charge` списывает hold победителя, записывает `winnerUser`, `winningBid`, `finishedAt`, ставит статус `FINISHED`.
- Остальные участники не держат hold (освобождались при перебитии), поэтому возвраты лишние. Если нужен пост-баланс — расширять `BalanceService`.