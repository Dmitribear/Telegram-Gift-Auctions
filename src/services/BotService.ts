import { AuctionStatus } from "../models/Auction.model";
import { BidCollection } from "../models/Bid";
import { auctionService } from "./AuctionService";
import { balanceService } from "./BalanceService";

export type BotConfig = {
  enabled: boolean;
  bots: number;
  minDelayMs: number;
  maxDelayMs: number;
  antiSnipeWindowSeconds: number;
  antiSnipeExtendSeconds: number;
  maxBidAmount?: number;
};

const defaultConfig: BotConfig = {
  enabled: false,
  bots: 0,
  minDelayMs: 2000,
  maxDelayMs: 6000,
  antiSnipeWindowSeconds: 5,
  antiSnipeExtendSeconds: 5,
  maxBidAmount: undefined,
};

class BotService {
  private config: BotConfig = { ...defaultConfig };
  private timers: NodeJS.Timeout[] = [];

  getConfig(): BotConfig {
    return this.config;
  }

  configure(partial: Partial<BotConfig>) {
    this.config = { ...this.config, ...partial };
    this.restart();
  }

  private restart() {
    this.stop();
    if (!this.config.enabled || this.config.bots <= 0) return;
    for (let i = 0; i < this.config.bots; i++) {
      this.scheduleBot(i);
    }
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private scheduleBot(id: number) {
    const delay =
      this.config.minDelayMs +
      Math.random() * (this.config.maxDelayMs - this.config.minDelayMs);

    const timer = setTimeout(async () => {
      try {
        await this.placeRandomBid(id);
      } catch (error) {
        console.error(`[bot-${id}] failed to bid`, error);
      } finally {
        this.scheduleBot(id);
      }
    }, delay);

    this.timers.push(timer);
  }

  private async placeRandomBid(botId: number) {
    const auctions = await auctionService.listAuctions();
    const active = auctions.filter((a) => a.status !== AuctionStatus.Ended);
    if (!active.length) return;

    const auction = active[Math.floor(Math.random() * active.length)];
    const lastBid = await BidCollection.findOne({ auction: auction._id })
      .sort({ createdAt: -1 })
      .exec();

    const base = (lastBid?.amount ?? auction.startPrice) + auction.bidStep;
    const multiplier = 0.2 + Math.random() * 0.8; // 20–100% extra step
    const amount = base + auction.bidStep * multiplier;

    if (
      this.config.maxBidAmount !== undefined &&
      this.config.maxBidAmount !== null &&
      this.config.maxBidAmount > 0 &&
      amount > this.config.maxBidAmount
    ) {
      return;
    }

    // Anti-snipe: если ставка сделана в последние X секунд "раунда",
    // задержим следующую активность ботов, имитируя продление.
    const now = Date.now();
    const lastAt = lastBid?.createdAt ? new Date(lastBid.createdAt).getTime() : 0;
    const sinceLast = lastAt ? (now - lastAt) / 1000 : Infinity;
    if (sinceLast <= this.config.antiSnipeWindowSeconds) {
      this.config.maxDelayMs += this.config.antiSnipeExtendSeconds * 1000;
    }

    const username = `bot-${botId}`;
    const user = await balanceService.ensureUser(username);
    if (!user.paymentMethod) {
      await balanceService.linkPayment(username, {
        type: "crypto",
        masked: "bot",
        provider: "internal",
      });
    }
    if (user.balance < amount) {
      await balanceService.deposit(username, amount * 2);
    }

    await auctionService.placeBid(auction._id.toString(), amount, username);
  }
}

export const botService = new BotService();
