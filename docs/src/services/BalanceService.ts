import mongoose from "mongoose";
import { BalanceLedgerRepository } from "../repositories/BalanceLedgerRepository";
import { UserRepository } from "../repositories/UserRepository";
import { HttpError } from "../utils/httpError";
import {
  defaultTransactionOptions,
  endSessionSafe,
} from "../utils/transactions";

export class BalanceService {
  static async deposit(userId: string, amount: number) {
    if (amount <= 0) {
      throw new HttpError(400, "Deposit amount must be greater than zero");
    }

    const session = await mongoose.startSession();
    try {
      let updatedUser = null;
      await session.withTransaction(async () => {
        const user = await UserRepository.findById(userId, session);
        if (!user) {
          throw new HttpError(404, "User not found");
        }

        updatedUser = await UserRepository.incrementBalance(
          userId,
          amount,
          session
        );

        await BalanceLedgerRepository.create(
          {
            user: user._id,
            change: amount,
            reason: "deposit",
            note: "User deposit",
          },
          session
        );
      }, defaultTransactionOptions);

      return updatedUser;
    } finally {
      await endSessionSafe(session);
    }
  }
}
