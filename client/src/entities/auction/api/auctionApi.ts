import { request } from "../../../shared/api/client";
import {
  Auction,
  AuctionDetailsResponse,
  Bid,
  CreateAuctionPayload,
} from "../model/types";

export const auctionApi = {
  getAll: (): Promise<Auction[]> => request<Auction[]>("/auctions"),
  getById: (id: string): Promise<AuctionDetailsResponse> =>
    request<AuctionDetailsResponse>(`/auctions/${id}`),
  create: (payload: CreateAuctionPayload): Promise<Auction> =>
    request<Auction>("/auctions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  placeBid: (id: string, amount: number): Promise<Bid> =>
    request<Bid>(`/auctions/${id}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  finalize: (id: string) => request<Auction>(`/auctions/${id}/finalize`, { method: "POST" }),
};
