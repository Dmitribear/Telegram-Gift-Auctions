import { Router } from "express";
import { userController } from "../controllers/UserController";

const router = Router();

router.post("/link", userController.linkPayment);
router.post("/deposit", userController.deposit);
router.get("/:username", userController.me);

export default router;
