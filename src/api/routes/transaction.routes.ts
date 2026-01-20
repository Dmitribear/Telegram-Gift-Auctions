import { Router } from "express";
import { transactionController } from "../controllers/TransactionController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, transactionController.list);

export default router;
