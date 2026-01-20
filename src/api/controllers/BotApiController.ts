import { Request, Response } from "express";
import { BotApiKeyCollection } from "../../models/BotApiKey";
import crypto from "crypto";
import { transactionService } from "../../services/TransactionService";
import { auctionService } from "../../services/AuctionService";
import { balanceService } from "../../services/BalanceService";

class BotApiController {
  list = async (_req: Request, res: Response): Promise<void> => {
    const keys = await BotApiKeyCollection.find().sort({ createdAt: -1 }).exec();
    res.json(keys);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const name = (req.body?.name as string | undefined)?.trim() || "bot-key";
    const apiKey = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const doc = await BotApiKeyCollection.create({ name, apiKey, active: true });
    res.status(201).json(doc);
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    await BotApiKeyCollection.findByIdAndUpdate(id, { active: false }).exec();
    res.json({ ok: true });
  };

  placeBotBid = async (req: Request, res: Response): Promise<void> => {
    const botKey = (req as any).botKey;
    const { auctionId, amount } = req.body ?? {};
    const numAmount = Number(amount);
    if (!auctionId || !Number.isFinite(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: "auctionId and amount > 0 required" });
      return;
    }
    const botUser = `bot-${botKey.name}`;
    try {
      const user = await balanceService.ensureUser(botUser);
      if (!user.paymentMethod) {
        await balanceService.linkPayment(botUser, { type: "crypto", masked: "bot", provider: "internal" });
      }
      if (user.balance < numAmount) {
        await balanceService.deposit(botUser, numAmount * 2);
      }
      const bid = await auctionService.placeBid(auctionId, numAmount, botUser);
      await transactionService.record({
        user: botUser,
        auctionId,
        type: "BOT_FUND",
        amount: numAmount,
        currency: "TON",
        meta: { via: "api-key" },
      });
      res.status(201).json(bid);
    } catch (error) {
      const message = (error as Error).message;
      res.status(400).json({ error: message });
    }
  };
}

export const botApiController = new BotApiController();
