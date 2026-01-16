import { Router } from "express";
import { UserController } from "../controllers/UserController";

const router = Router();

router.post("/", UserController.createUser);
router.get("/:userId", UserController.getUser);
router.post("/:userId/deposit", UserController.deposit);

export default router;
