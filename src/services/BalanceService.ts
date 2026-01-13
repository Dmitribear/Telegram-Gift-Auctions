import { BalanceLedgerCollection } from "../models/BalanceLedger";
import { UserCollection, UserDocument } from "../models/User";
import { transactionService } from "./TransactionService";

class BalanceService {
  async ensureUser(username: string): Promise<UserDocument> {
    let user = await UserCollection.findOne({ username }).exec();
    if (!user) {
      user = await UserCollection.create({ username, balance: 0, heldBalance: 0 });
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
    const release = Math.min(user.heldBalance, amount);
    user.heldBalance = Math.max(0, user.heldBalance - release);
    await user.save();
    await this.addLedger(user.username, auctionId, "RELEASE", amount);
  }

  async hold(user: UserDocument, auctionId: string, amount: number) {
    if (amount <= 0) return;
    if (user.balance < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    user.balance -= amount;
    user.heldBalance += amount;
    await user.save();
    await this.addLedger(user.username, auctionId, "HOLD", amount);
  }

  async charge(user: UserDocument, auctionId: string, amount: number) {
    const total = user.balance + user.heldBalance;
    if (total < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    const fromHeld = Math.min(user.heldBalance, amount);
    user.heldBalance -= fromHeld;
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
