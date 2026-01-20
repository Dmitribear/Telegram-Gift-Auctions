import { Router } from "express";
import { z } from "zod";
import { userController } from "../controllers/UserController";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.post(
  "/link",
  requireAuth,
  validate({
    body: z.object({
      username: z.string().optional(),
      type: z.enum(["card", "crypto"]),
      masked: z.string().min(2),
      provider: z.string().optional(),
    }),
  }),
  userController.linkPayment
);

router.post(
  "/deposit",
  requireAuth,
  validate({
    body: z.object({
      username: z.string().optional(),
      amount: z.number().positive(),
    }),
  }),
  userController.deposit
);

router.get("/:username?", requireAuth, userController.me);

export default router;
