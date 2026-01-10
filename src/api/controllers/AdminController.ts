import { Request, Response } from "express";
import { botService, BotConfig } from "../../services/BotService";

class AdminController {
  // Демонстрационный режим: логин всегда успешен
  login = (_req: Request, res: Response): void => {
    res.json({ ok: true });
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