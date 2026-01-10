import { ClientSession } from "mongoose";
import { IRound, Round } from "../models/Round";

export class RoundRepository {
  static create(data: Partial<IRound>, session?: ClientSession) {
    const round = new Round(data);
    return round.save({ session });
  }

  static listByAuction(auctionId: string, session?: ClientSession) {
    return Round.find({ auction: auctionId })
      .sort({ number: 1 })
      .session(session ?? null);
  }
}
