import { TransactionCollection, Transaction } from "../models/Transaction";

class TransactionService {
  async record(entry: {
    user: string;
    auctionId?: any;
    type: Transaction["type"];
    amount: number;
    currency: string;
    meta?: any;
  }) {
    return TransactionCollection.create(entry);
  }

  async list(filter: Partial<Transaction> = {}, limit = 50) {
    return TransactionCollection.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const transactionService = new TransactionService();
