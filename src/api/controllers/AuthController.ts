import { Request, Response } from "express";
import { authService } from "../../services/AuthService";

class AuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    const username =
      (req.body?.username as string | undefined)?.trim() ||
      (req.headers["x-username"] as string | undefined)?.trim();
    if (!username) {
      res.status(400).json({ error: "username required" });
      return;
    }
    try {
      const result = await authService.login(username);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  };
}

export const authController = new AuthController();
