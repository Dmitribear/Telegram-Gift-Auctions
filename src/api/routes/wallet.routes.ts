import { Router } from "express";
import { walletController } from "../controllers/WalletController";

const router = Router();

router.get("/", walletController.me);
router.post("/faucet", walletController.faucet);
router.post("/send", walletController.send);
router.post("/bridge-to-site", walletController.bridgeToSite);
router.post("/bridge-from-site", walletController.bridgeFromSite);

export default router;
