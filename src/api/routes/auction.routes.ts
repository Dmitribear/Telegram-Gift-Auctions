import { Router } from "express";
import { z } from "zod";
import { auctionController } from "../controllers/AuctionController";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const createAuctionSchema = validate({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    startPrice: z.number().nonnegative(),
    bidStep: z.number().positive(),
    baseDurationMinutes: z.number().positive(),
    startTime: z.string().datetime().optional(),
    antiSnipeWindowMinutes: z.number().nonnegative().optional(),
    antiSnipeExtensionMinutes: z.number().nonnegative().optional(),
  }),
});

const bidSchema = validate({
  body: z.object({
    amount: z.number().positive(),
  }),
});

router.get("/", auctionController.list);
router.get("/:id", auctionController.getById);
router.post("/", requireAdmin, createAuctionSchema, auctionController.create);
router.post("/:id/bids", requireAuth, bidSchema, auctionController.placeBid);
router.post("/:id/finalize", requireAdmin, auctionController.finalize);

export default router;
