import { Router } from "express";
import { adminController } from "../controllers/AdminController";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.post("/login", adminController.login);
router.get("/bots", requireAdmin, adminController.getBots);
router.post("/bots", requireAdmin, adminController.updateBots);

export default router;
