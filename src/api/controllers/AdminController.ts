import { Request, Response } from "express";
import { botService, BotConfig } from "../../services/BotService";
import { authService } from "../../services/AuthService";

class AdminController {
  login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body ?? {};
    if (!password) {
      res.status(400).json({ error: "password required" });
      return;
    }
    try {
      const result = await authService.loginAdmin(username, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: "Invalid admin secret" });
    }
  };

  getBots = (_req: Request, res: Response): void => {
    res.json(botService.getConfig());
  };

  updateBots = (req: Request, res: Response): void => {
    const body: Partial<BotConfig> = req.body ?? {};
    botService.configure(body);
    res.json(botService.getConfig());
  };
}

export const adminController = new AdminController();
