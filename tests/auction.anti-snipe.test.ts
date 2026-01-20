import { describe, it, expect, beforeEach } from "vitest";
import { auctionService } from "../src/services/AuctionService";
import { balanceService } from "../src/services/BalanceService";
import { AuctionCollection, AuctionStatus } from "../src/models/Auction.model";

describe("AuctionService anti-snipe", () => {
  beforeEach(async () => {
    // ensure bidders have balance and payment method
    await balanceService.linkPayment("bidder", {
      type: "card",
      masked: "**** 1111",
    });
    await balanceService.deposit("bidder", 200);
  });

  it("extends end time when bid comes in anti-snipe window", async () => {
    const auction = await auctionService.createAuction({
      title: "Anti-snipe lot",
      description: "Ends soon",
      startPrice: 10,
      bidStep: 5,
      baseDurationMinutes: 0.02, // ~1.2s
      antiSnipeWindowMinutes: 1,
      antiSnipeExtensionMinutes: 1,
    });

    const initialEnd = auction.endTime.getTime();
    await auctionService.placeBid(auction._id.toString(), 15, "bidder");
    const updated = await AuctionCollection.findById(auction._id).exec();

    expect(updated?.status).toBe(AuctionStatus.Active);
    expect(updated?.endTime.getTime()).toBeGreaterThan(initialEnd);
  });
});
