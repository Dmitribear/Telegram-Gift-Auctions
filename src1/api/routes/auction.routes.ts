import { Router } from "express";
import { AuctionController } from "../controllers/AuctionController";
import { BidController } from "../controllers/BidController";

const router = Router();

router.post("/", AuctionController.createAuction);
router.get("/", AuctionController.listAuctions);
router.get("/:auctionId", AuctionController.getAuction);
router.post("/:auctionId/finalize", AuctionController.finalizeAuction);
router.get("/:auctionId/bids", AuctionController.listBids);
router.post("/:auctionId/bids", BidController.placeBid);

export default router;
