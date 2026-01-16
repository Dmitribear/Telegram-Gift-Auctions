import { ClientSession } from "mongoose";
import { Bid, IBid } from "../models/Bid";

export class BidRepository {
  static create(data: Partial<IBid>, session?: ClientSession) {
    const bid = new Bid(data);
    return bid.save({ session });
  }

  static listByAuction(
    auctionId: string,
    limit = 50,
    session?: ClientSession
  ) {
    return Bid.find({ auction: auctionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .session(session ?? null);
  }
}
