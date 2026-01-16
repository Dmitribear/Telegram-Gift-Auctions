import { BalanceLedgerCollection } from "../models/BalanceLedger";
import { UserCollection, UserDocument } from "../models/User";
import { transactionService } from "./TransactionService";

class BalanceService {
  async ensureUser(username: string): Promise<UserDocument> {
    let user = await UserCollection.findOne({ username }).exec();
    if (!user) {
      user = await UserCollection.create({
        username,
        balance: 0,
        lockedBalance: 0,
        heldBalance: 0,
      });
    }
    return user;
  }

  async linkPayment(
    username: string,
    method: { type: "card" | "crypto"; masked: string; provider?: string }
  ): Promise<UserDocument> {
    const user = await this.ensureUser(username);
    user.paymentMethod = method;
    await user.save();
    await transactionService.record({
      user: username,
      type: "LINK_PAYMENT",
      amount: 0,
      currency: "TON",
      auctionId: undefined,
      meta: { method },
    });
    return user;
  }

  async deposit(username: string, amount: number): Promise<UserDocument> {
    const user = await this.ensureUser(username);
    user.balance += amount;
    await user.save();
    await transactionService.record({
      user: username,
      type: "DEPOSIT",
      amount,
      currency: "TON",
      auctionId: undefined,
    });
    return user;
  }

  async get(username: string): Promise<UserDocument | null> {
    return UserCollection.findOne({ username }).exec();
  }

  private async addLedger(
    user: string,
    auctionId: string,
    type: "HOLD" | "RELEASE" | "CHARGE" | "PRIZE",
    amount: number
  ) {
    await BalanceLedgerCollection.create({ user, auctionId, type, amount });
    await transactionService.record({
      user,
      auctionId,
      type: type === "PRIZE" ? "PRIZE" : type,
      amount,
      currency: "TON",
    });
  }

  async releaseHold(user: UserDocument, auctionId: string, amount: number) {
    if (amount <= 0) return;
    const release = Math.min(user.lockedBalance ?? user.heldBalance, amount);
    user.lockedBalance = Math.max(0, (user.lockedBalance ?? 0) - release);
    // оставляем heldBalance для обратной совместимости
    user.heldBalance = Math.max(0, (user.heldBalance ?? 0) - release);
    await user.save();
    await this.addLedger(user.username, auctionId, "RELEASE", amount);
  }

  async hold(user: UserDocument, auctionId: string, amount: number) {
    if (amount <= 0) return;
    if (user.balance < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    user.balance -= amount;
    user.lockedBalance = (user.lockedBalance ?? 0) + amount;
    user.heldBalance = (user.heldBalance ?? 0) + amount;
    await user.save();
    await this.addLedger(user.username, auctionId, "HOLD", amount);
  }

  async charge(user: UserDocument, auctionId: string, amount: number) {
    const locked = user.lockedBalance ?? user.heldBalance ?? 0;
    const total = user.balance + locked;
    if (total < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    const fromHeld = Math.min(locked, amount);
    user.lockedBalance = Math.max(0, locked - fromHeld);
    user.heldBalance = Math.max(0, (user.heldBalance ?? locked) - fromHeld);
    const rest = amount - fromHeld;
    if (rest > 0) user.balance -= rest;
    await user.save();
    await this.addLedger(user.username, auctionId, "CHARGE", amount);
  }

  async awardPrize(user: UserDocument, auctionId: string, amount: number) {
    user.prizeBalance = (user.prizeBalance ?? 0) + amount;
    await user.save();
    await this.addLedger(user.username, auctionId, "PRIZE", amount);
  }
}

export const balanceService = new BalanceService();
