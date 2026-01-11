import { Router } from "express";
import { botApiController } from "../controllers/BotApiController";
import { requireBotKey } from "../middleware/auth";

const router = Router();

router.get("/", botApiController.list);
router.post("/", botApiController.create);
router.post("/:id/revoke", botApiController.revoke);
router.post("/bid", requireBotKey, botApiController.placeBotBid);

export default router;
