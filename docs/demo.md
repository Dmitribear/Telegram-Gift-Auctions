## Мини-демо через curl

> Примеры ниже используют чистый ASCII для корректного копипаста в Windows/Unix терминалах.

### 1) Создать пользователя
Unix:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  --data-raw '{"username":"alice","balance":5000}'
```

PowerShell:
```powershell
curl.exe -X POST http://localhost:3000/api/users `
  -H "Content-Type: application/json" `
  --data-raw "{\"username\":\"alice\",\"balance\":5000}"
```

PowerShell через `Invoke-RestMethod`:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/users `
  -ContentType "application/json" `
  -Body (@{ username = "alice"; balance = 5000 } | ConvertTo-Json)
```

### 2) Пополнить баланс
```bash
curl -X POST http://localhost:3000/api/users/<userId>/deposit \
  -H "Content-Type: application/json" \
  --data-raw '{"amount":2000}'
```

PowerShell:
```powershell
curl.exe -X POST http://localhost:3000/api/users/<userId>/deposit `
  -H "Content-Type: application/json" `
  --data-raw "{\"amount\":2000}"
```

PowerShell через `Invoke-RestMethod`:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/users/<userId>/deposit `
  -ContentType "application/json" `
  -Body (@{ amount = 2000 } | ConvertTo-Json)
```

### 3) Создать аукцион
```bash
curl -X POST http://localhost:3000/api/auctions \
  -H "Content-Type: application/json" \
  --data-raw '{
    "title":"Telegram gift",
    "description":"Подарочный набор",
    "startPrice":1000,
    "bidStep":100,
    "baseDurationMinutes":60,
    "antiSnipeWindowMinutes":10,
    "antiSnipeExtensionMinutes":5
  }'
```

PowerShell версия (экранируйте кавычки):
```powershell
curl.exe -X POST http://localhost:3000/api/auctions `
  -H "Content-Type: application/json" `
  --data-raw "{`"title`":`"Telegram gift`",`"description`":`"Подарочный набор`",`"startPrice`":1000,`"bidStep`":100,`"baseDurationMinutes`":60,`"antiSnipeWindowMinutes`":10,`"antiSnipeExtensionMinutes`":5}"
```

PowerShell через `Invoke-RestMethod`:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auctions `
  -ContentType "application/json" `
  -Body (@{
    title = "Telegram gift";
    description = "Подарочный набор";
    startPrice = 1000;
    bidStep = 100;
    baseDurationMinutes = 60;
    antiSnipeWindowMinutes = 10;
    antiSnipeExtensionMinutes = 5
  } | ConvertTo-Json)
```

### 4) Сделать ставку
```bash
curl -X POST http://localhost:3000/api/auctions/<auctionId>/bids \
  -H "Content-Type: application/json" \
  --data-raw '{"userId":"<userId>","amount":1200}'
```

PowerShell:
```powershell
curl.exe -X POST http://localhost:3000/api/auctions/<auctionId>/bids `
  -H "Content-Type: application/json" `
  --data-raw "{\"userId\":\"<userId>\",\"amount\":1200}"
```

PowerShell через `Invoke-RestMethod`:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auctions/<auctionId>/bids `
  -ContentType "application/json" `
  -Body (@{ userId = "<userId>"; amount = 1200 } | ConvertTo-Json)
```

### 5) Посмотреть ставки
```bash
curl http://localhost:3000/api/auctions/<auctionId>/bids
```

PowerShell:
```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/auctions/<auctionId>/bids
```

### 6) Финализировать вручную
```bash
curl -X POST http://localhost:3000/api/auctions/<auctionId>/finalize
```

PowerShell:
```powershell
curl.exe -X POST http://localhost:3000/api/auctions/<auctionId>/finalize
```

PowerShell через `Invoke-RestMethod`:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auctions/<auctionId>/finalize
```

Инфраструктура: `docker compose up -d` (MongoDB replica set + Redis). Запуск сервера: `npm run dev`.
