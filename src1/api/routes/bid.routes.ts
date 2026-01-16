import { Router } from "express";
import { BidController } from "../controllers/BidController";

const router = Router();

router.post("/", BidController.placeBid);

export default router;
