import { Router } from "express";
import { z } from "zod";
import { adminController } from "../controllers/AdminController";
import { requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.post(
  "/login",
  validate({ body: z.object({ username: z.string().optional(), password: z.string() }) }),
  adminController.login
);
router.get("/bots", requireAdmin, adminController.getBots);
router.post("/bots", requireAdmin, adminController.updateBots);

export default router;
