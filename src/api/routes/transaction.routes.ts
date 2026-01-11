import { Router } from "express";
import { transactionController } from "../controllers/TransactionController";

const router = Router();

router.get("/", transactionController.list);

export default router;
