import { Request, Response, NextFunction } from "express";

// Демонстрационный режим: админ-панель открыта для всех.
export function requireAdmin(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}