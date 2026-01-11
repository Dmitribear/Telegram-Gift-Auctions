import jwt from "jsonwebtoken";
import { balanceService } from "./BalanceService";

const JWT_SECRET = process.env.JWT_SECRET || "demo-secret";
const JWT_EXPIRES_IN = "12h";

export interface AuthTokenPayload {
  username: string;
}

class AuthService {
  issueToken(username: string): string {
    const payload: AuthTokenPayload = { username };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }

  async login(username: string): Promise<{ token: string }> {
    await balanceService.ensureUser(username);
    const token = this.issueToken(username);
    return { token };
  }
}

export const authService = new AuthService();
