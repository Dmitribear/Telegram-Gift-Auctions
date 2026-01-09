import { Router } from "express";
import { auctionController } from "../controllers/AuctionController";

const router = Router();

router.post("/", auctionController.create);

export default router;