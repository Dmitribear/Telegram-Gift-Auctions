import { ClientSession } from "mongoose";
import { Auction, AuctionStatus, IAuction } from "../models/Auction";

export class AuctionRepository {
  static create(data: Partial<IAuction>, session?: ClientSession) {
    const auction = new Auction(data);
    return auction.save({ session });
  }

  static findById(id: string, session?: ClientSession) {
    return Auction.findById(id).session(session ?? null);
  }

  static list(
    filters: Record<string, unknown>,
    limit = 50,
    session?: ClientSession
  ) {
    return Auction.find(filters)
      .limit(limit)
      .sort({ endTime: 1 })
      .session(session ?? null);
  }

  static updateById(
    id: string,
    updates: Partial<IAuction>,
    session?: ClientSession
  ) {
    return Auction.findByIdAndUpdate(id, updates, {
      new: true,
      session,
    });
  }

  static markEnded(
    id: string,
    payload: Partial<IAuction>,
    session?: ClientSession
  ) {
    return Auction.findByIdAndUpdate(
      id,
      { ...payload, status: AuctionStatus.Ended },
      { new: true, session }
    );
  }
}
