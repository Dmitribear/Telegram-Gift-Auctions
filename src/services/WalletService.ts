import { randomUUID } from "crypto";
import { WalletCollection, WalletDocument } from "../models/Wallet";
import { balanceService } from "./BalanceService";
import { transactionService } from "./TransactionService";

const FEE = 0.01;

class WalletService {
  async ensureWallet(user: string): Promise<WalletDocument> {
    let w = await WalletCollection.findOne({ user }).exec();
    if (!w) {
      w = await WalletCollection.create({
        user,
        address: `ton-sim-${randomUUID()}`,
        balanceTon: 0,
      });
    }
    return w;
  }

  async faucet(user: string, amount: number) {
    const w = await this.ensureWallet(user);
    w.balanceTon += amount;
    w.tx.push({
      type: "FAUCET",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save();
    await transactionService.record({
      user,
      type: "DEPOSIT",
      amount,
      currency: "TON",
      auctionId: undefined,
      meta: { source: "faucet" },
    });
    return w;
  }

  async send(user: string, amount: number, to: string) {
    const w = await this.ensureWallet(user);
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
    await w.save();
    return w;
  }

  async bridgeToSite(user: string, amount: number) {
    const w = await this.ensureWallet(user);
    if (w.balanceTon < amount) throw new Error("INSUFFICIENT_WALLET_FUNDS");
    w.balanceTon -= amount;
    w.tx.push({
      type: "BRIDGE_OUT",
      amount,
      to: "site-balance",
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save();
    await balanceService.deposit(user, amount);
    await transactionService.record({
      user,
      type: "BRIDGE_IN",
      amount,
      currency: "TON",
      auctionId: undefined,
      meta: { from: w.address },
    });
    return w;
  }

  async bridgeFromSite(user: string, amount: number) {
    const w = await this.ensureWallet(user);
    const u = await balanceService.ensureUser(user);
    if (u.balance < amount) throw new Error("INSUFFICIENT_SITE_BALANCE");
    u.balance -= amount;
    await u.save();
    w.balanceTon += amount;
    w.tx.push({
      type: "BRIDGE_IN",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save();
    await transactionService.record({
      user,
      type: "BRIDGE_OUT",
      amount,
      currency: "TON",
      auctionId: undefined,
      meta: { to: w.address },
    });
    return w;
  }

  async refundToWallet(user: string, amount: number, reason: string) {
    if (amount <= 0) return;
    const w = await this.ensureWallet(user);
    w.balanceTon += amount;
    w.tx.push({
      type: "REFUND",
      amount,
      to: w.address,
      hash: randomUUID(),
      status: "confirmed",
    });
    await w.save();
    await transactionService.record({
      user,
      type: "BRIDGE_OUT",
      amount,
      currency: "TON",
      auctionId: undefined,
      meta: { reason },
    });
  }
}

export const walletService = new WalletService();
