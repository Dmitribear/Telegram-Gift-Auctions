import { randomUUID } from "crypto";
import { ClientSession } from "mongoose";
import { WalletCollection, WalletDocument } from "../models/Wallet";
import { balanceService } from "./BalanceService";
import { transactionService } from "./TransactionService";

const FEE = 0.01;

class WalletService {
  async ensureWallet(user: string, session?: ClientSession): Promise<WalletDocument> {
    let w = await WalletCollection.findOne({ user }).session(session ?? null).exec();
    if (!w) {
      const created = await WalletCollection.create(
        [
          {
            user,
            address: `ton-sim-${randomUUID()}`,
            balanceTon: 0,
          },
        ],
        { session }
      );
      w = created[0];
    }
    return w;
  }

  async faucet(user: string, amount: number, session?: ClientSession) {
    const w = await this.ensureWallet(user, session);
    w.balanceTon += amount;
    w.tx.push({
      type: "FAUCET",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save({ session });
    await transactionService.record(
      {
        user,
        type: "DEPOSIT",
        amount,
        currency: "TON",
        auctionId: undefined,
        meta: { source: "faucet" },
      },
      session
    );
    return w;
  }

  async send(user: string, amount: number, to: string, session?: ClientSession) {
    const w = await this.ensureWallet(user, session);
    const total = amount + FEE;
    if (w.balanceTon < total) throw new Error("INSUFFICIENT_WALLET_FUNDS");
    w.balanceTon -= total;
    w.tx.push({
      type: "SEND",
      amount,
      to,
      hash: randomUUID(),
      status: "confirmed",
    });
    w.tx.push({
      type: "FEE",
      amount: FEE,
      to,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save({ session });
    return w;
  }

  async bridgeToSite(user: string, amount: number, session?: ClientSession) {
    const w = await this.ensureWallet(user, session);
    if (w.balanceTon < amount) throw new Error("INSUFFICIENT_WALLET_FUNDS");
    w.balanceTon -= amount;
    w.tx.push({
      type: "BRIDGE_OUT",
      amount,
      to: "site-balance",
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save({ session });
    await balanceService.deposit(user, amount, session);
    await transactionService.record(
      {
        user,
        type: "BRIDGE_IN",
        amount,
        currency: "TON",
        auctionId: undefined,
        meta: { from: w.address },
      },
      session
    );
    return w;
  }

  async bridgeFromSite(user: string, amount: number, session?: ClientSession) {
    const w = await this.ensureWallet(user, session);
    const u = await balanceService.ensureUser(user, session);
    if (u.balance < amount) throw new Error("INSUFFICIENT_SITE_BALANCE");
    u.balance -= amount;
    await u.save({ session });
    w.balanceTon += amount;
    w.tx.push({
      type: "BRIDGE_IN",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save({ session });
    await transactionService.record(
      {
        user,
        type: "BRIDGE_OUT",
        amount,
        currency: "TON",
        auctionId: undefined,
        meta: { to: w.address },
      },
      session
    );
    return w;
  }

  async refundToWallet(user: string, amount: number, reason: string, session?: ClientSession) {
    if (amount <= 0) return;
    const w = await this.ensureWallet(user, session);
    w.balanceTon += amount;
    w.tx.push({
      type: "REFUND",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save({ session });
    await transactionService.record(
      {
        user,
        type: "BRIDGE_OUT",
        amount,
        currency: "TON",
        auctionId: undefined,
        meta: { reason },
      },
      session
    );
  }
}

export const walletService = new WalletService();
