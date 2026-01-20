import { Router } from "express";
import { z } from "zod";
import { botApiController } from "../controllers/BotApiController";
import { requireAdmin, requireBotKey } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.get("/", requireAdmin, botApiController.list);
router.post(
  "/",
  requireAdmin,
  validate({ body: z.object({ name: z.string().optional() }) }),
  botApiController.create
);
router.post("/:id/revoke", requireAdmin, botApiController.revoke);
router.post(
  "/bid",
  requireBotKey,
  validate({
    body: z.object({
      auctionId: z.string().min(1),
      amount: z.number().positive(),
    }),
  }),
  botApiController.placeBotBid
);

export default router;
