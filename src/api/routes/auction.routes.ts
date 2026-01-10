import { Router } from "express";
import { auctionController } from "../controllers/AuctionController";

const router = Router();

router.get("/", auctionController.list);
router.get("/:id", auctionController.getById);
router.post("/", auctionController.create);
router.post("/:id/bids", auctionController.placeBid);
router.post("/:id/finalize", auctionController.finalize);

export default router;