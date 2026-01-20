import { AuctionCollection, AuctionStatus } from "../models/Auction.model";
import { auctionService } from "../services/AuctionService";
import { notificationService } from "../services/NotificationService";
import { logger } from "../utils/logger";

const POLL_MS = Number(process.env.FINALIZE_POLL_MS ?? 15000);
let running = false;

export function startAuctionFinalizer(): void {
  if (process.env.DISABLE_SCHEDULER === "true" || process.env.NODE_ENV === "test") {
    logger.info("Auction finalizer disabled via env");
    return;
  }

  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const due = await AuctionCollection.find({
        status: { $ne: AuctionStatus.Ended },
        endTime: { $lte: now },
      })
        .sort({ endTime: 1 })
        .limit(20)
        .exec();

      for (const auction of due) {
        try {
          const finalized = await auctionService.finalizeAuction(
            auction._id.toString(),
            true
          );
          await notificationService.notifyAuctionFinalized(
            finalized,
            finalized.winnerUserId?.toString(),
            finalized.currentPrice
          );
        } catch (err) {
          logger.warn("Auto-finalize failed", {
            auctionId: auction._id.toString(),
            error: (err as Error).message,
          });
        }
      }
    } catch (err) {
      logger.error("Finalizer tick failed", { error: (err as Error).message });
    } finally {
      running = false;
    }
  }, POLL_MS);
}
