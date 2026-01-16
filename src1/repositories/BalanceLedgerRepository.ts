import { ClientSession } from "mongoose";
import { BalanceLedger, IBalanceLedger } from "../models/BalanceLedger";

export class BalanceLedgerRepository {
  static create(entry: Partial<IBalanceLedger>, session?: ClientSession) {
    const record = new BalanceLedger(entry);
    return record.save({ session });
  }

  static listByUser(userId: string, limit = 50, session?: ClientSession) {
    return BalanceLedger.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .session(session ?? null);
  }
}
