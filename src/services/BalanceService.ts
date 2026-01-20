import { ClientSession } from "mongoose";
import { BalanceLedgerCollection } from "../models/BalanceLedger";
import { UserCollection, UserDocument } from "../models/User";
import { transactionService } from "./TransactionService";

class BalanceService {
  async ensureUser(username: string, session?: ClientSession): Promise<UserDocument> {
    let user = await UserCollection.findOne({ username }).session(session ?? null).exec();
    if (!user) {
      const created = await UserCollection.create(
        [
          {
            username,
            balance: 0,
            lockedBalance: 0,
            heldBalance: 0,
            prizeBalance: 0,
          },
        ],
        { session }
      );
      user = created[0];
    }
    return user;
  }

  async linkPayment(
    username: string,
    method: { type: "card" | "crypto"; masked: string; provider?: string },
    session?: ClientSession
  ): Promise<UserDocument> {
    const user = await this.ensureUser(username, session);
    user.paymentMethod = method;
    await user.save({ session });
    await transactionService.record(
      {
        user: username,
        type: "LINK_PAYMENT",
        amount: 0,
        currency: "TON",
        auctionId: undefined,
        meta: { method },
      },
      session
    );
    return user;
  }

  async deposit(username: string, amount: number, session?: ClientSession): Promise<UserDocument> {
    const user = await this.ensureUser(username, session);
    user.balance += amount;
    await user.save({ session });
    await transactionService.record(
      {
        user: username,
        type: "DEPOSIT",
        amount,
        currency: "TON",
        auctionId: undefined,
      },
      session
    );
    return user;
  }

  async get(username: string): Promise<UserDocument | null> {
    return UserCollection.findOne({ username }).exec();
  }

  private async addLedger(
    user: string,
    auctionId: string,
    type: "HOLD" | "RELEASE" | "CHARGE" | "PRIZE",
    amount: number,
    session?: ClientSession
  ) {
    await BalanceLedgerCollection.create([{ user, auctionId, type, amount }], {
      session,
    });
    await transactionService.record(
      {
        user,
        auctionId,
        type: type === "PRIZE" ? "PRIZE" : type,
        amount,
        currency: "TON",
      },
      session
    );
  }

  async releaseHold(
    user: UserDocument,
    auctionId: string,
    amount: number,
    session?: ClientSession
  ) {
    if (amount <= 0) return;
    const release = Math.min(user.lockedBalance ?? 0, amount);
    user.lockedBalance = Math.max(0, (user.lockedBalance ?? 0) - release);
    user.heldBalance = Math.max(0, (user.heldBalance ?? 0) - release);
    user.balance += release;
    await user.save({ session });
    await this.addLedger(user.username, auctionId, "RELEASE", release, session);
  }

  async hold(user: UserDocument, auctionId: string, amount: number, session?: ClientSession) {
    if (amount <= 0) return;
    if (user.balance < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    user.balance -= amount;
    user.lockedBalance = (user.lockedBalance ?? 0) + amount;
    user.heldBalance = (user.heldBalance ?? 0) + amount;
    await user.save({ session });
    await this.addLedger(user.username, auctionId, "HOLD", amount, session);
  }

  async charge(user: UserDocument, auctionId: string, amount: number, session?: ClientSession) {
    const locked = user.lockedBalance ?? 0;
    const total = user.balance + locked;
    if (total < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    const fromHeld = Math.min(locked, amount);
    user.lockedBalance = Math.max(0, locked - fromHeld);
    user.heldBalance = Math.max(0, (user.heldBalance ?? locked) - fromHeld);
    const rest = amount - fromHeld;
    if (rest > 0) user.balance -= rest;
    await user.save({ session });
    await this.addLedger(user.username, auctionId, "CHARGE", amount, session);
  }

  async awardPrize(user: UserDocument, auctionId: string, amount: number, session?: ClientSession) {
    user.prizeBalance = (user.prizeBalance ?? 0) + amount;
    await user.save({ session });
    await this.addLedger(user.username, auctionId, "PRIZE", amount, session);
  }
}

export const balanceService = new BalanceService();
