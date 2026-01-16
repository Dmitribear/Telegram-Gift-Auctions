import { TransactionOptions } from "mongodb";
import { ClientSession } from "mongoose";

export const defaultTransactionOptions: TransactionOptions = {
  readPreference: "primary",
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};

export const endSessionSafe = async (session?: ClientSession | null) => {
  if (session) {
    await session.endSession().catch(() => {
      /* no-op */
    });
  }
};
