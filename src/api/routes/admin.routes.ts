import { Router } from "express";
import { AdminController } from "../controllers/AdminController";

const router = Router();

router.post("/auctions/:auctionId/close", AdminController.closeAuction);

export default router;
