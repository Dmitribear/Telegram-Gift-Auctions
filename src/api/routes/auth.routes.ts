import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/AuthController";
import { validate } from "../middleware/validate";

const router = Router();

router.post(
  "/login",
  validate({ body: z.object({ username: z.string().min(1) }) }),
  authController.login
);

export default router;
