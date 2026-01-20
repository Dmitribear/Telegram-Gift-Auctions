import { Router } from "express";
import { z } from "zod";
import { walletController } from "../controllers/WalletController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.get("/", requireAuth, walletController.me);
router.post(
  "/faucet",
  requireAuth,
  validate({ body: z.object({ amount: z.number().positive().optional() }) }),
  walletController.faucet
);
router.post(
  "/send",
  requireAuth,
  validate({
    body: z.object({
      to: z.string().min(1),
      amount: z.number().positive(),
    }),
  }),
  walletController.send
);
router.post(
  "/bridge-to-site",
  requireAuth,
  validate({ body: z.object({ amount: z.number().positive() }) }),
  walletController.bridgeToSite
);
router.post(
  "/bridge-from-site",
  requireAuth,
  validate({ body: z.object({ amount: z.number().positive() }) }),
  walletController.bridgeFromSite
);

export default router;
