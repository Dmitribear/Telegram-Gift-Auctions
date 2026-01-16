import { AuctionService } from "../src/services/AuctionService";
import { AuctionStatus } from "../src/models/Auction";
import { HttpError } from "../src/utils/httpError";

describe("AuctionService.finalizeAuction", () => {
  it("allows force finalization of active auction when force=true", async () => {
    const auction = await AuctionService.createAuction({
      title: "Test lot",
      description: "Force finalization check",
      startPrice: 100,
      bidStep: 10,
      baseDurationMinutes: 60,
      startTime: new Date(),
      antiSnipeWindowMinutes: 10,
      antiSnipeExtensionMinutes: 5,
    });

    expect(auction.status).toBe(AuctionStatus.Active);

    const finalized = await AuctionService.finalizeAuction(
      auction._id.toString(),
      undefined,
      true
    );

    expect(finalized?.status).toBe(AuctionStatus.Ended);
    expect(finalized?.winnerUserId).toBeUndefined();
  });

  it("rejects finalization of active auction without force flag", async () => {
    const auction = await AuctionService.createAuction({
      title: "Active lot",
      startPrice: 100,
      bidStep: 10,
      baseDurationMinutes: 60,
      startTime: new Date(),
    });

    await expect(
      AuctionService.finalizeAuction(auction._id.toString())
    ).rejects.toThrow(HttpError);
  });
});
