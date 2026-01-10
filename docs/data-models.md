## Сущности

### User
| поле | тип | описание |
| --- | --- | --- |
| `_id` | ObjectId | идентификатор пользователя |
| `username` | string (unique) | логин/ник |
| `balance` | number | свободный баланс |
| `lockedBalance` | number | зарезервировано под активные ставки (не используется для списаний сейчас, оставлено для будущего расширения) |
| `createdAt/updatedAt` | Date | системные метки |

### Auction
| поле | тип | описание |
| --- | --- | --- |
| `title` | string | название лота |
| `description` | string? | описание |
| `startPrice` | number | стартовая цена |
| `bidStep` | number | минимальный шаг ставки |
| `currentPrice` | number | текущая цена (стартовая до первой ставки) |
| `startTime` | Date | время старта |
| `endTime` | Date | дедлайн (может сдвигаться анти-снайпингом) |
| `antiSnipeWindowMs` | number | окно продления в конце аукциона |
| `antiSnipeExtensionMs` | number | длительность продления |
| `status` | enum(`scheduled`,`active`,`ended`) | состояние аукциона |
| `highestBidder` | ObjectId(User)? | лидер на текущий момент |
| `highestBid` | ObjectId(Bid)? | ставка-лидер |
| `bidsCount` | number | количество ставок |
| `winnerUserId/winnerBidId` | ObjectId? | финальный победитель/ставка |
| `createdAt/updatedAt` | Date | системные метки |

### Bid
| поле | тип | описание |
| --- | --- | --- |
| `auction` | ObjectId(Auction) | ссылка на аукцион |
| `user` | ObjectId(User) | автор ставки |
| `amount` | number | сумма ставки |
| `createdAt` | Date | время создания |

### BalanceLedger
| поле | тип | описание |
| --- | --- | --- |
| `user` | ObjectId(User) | владелец |
| `change` | number | изменение баланса (депозит > 0, прочее может быть 0) |
| `reason` | deposit \| bid_hold \| bid_release \| payout \| adjustment | тип операции |
| `auction` | ObjectId(Auction)? | связано с конкретным аукционом |
| `note` | string? | произвольный комментарий |
| `createdAt` | Date | время события |

### Winner
| поле | тип | описание |
| --- | --- | --- |
| `auction` | ObjectId(Auction, unique) | завершённый аукцион |
| `user` | ObjectId(User) | победитель |
| `bid` | ObjectId(Bid) | победная ставка |
| `finalPrice` | number | цена фиксации |
| `createdAt` | Date | время фиксации |
