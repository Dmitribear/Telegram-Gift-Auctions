import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import { HttpError } from "../../utils/httpError";

type SchemaShape = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export const validate =
  (schema: SchemaShape) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.query) req.query = schema.query.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        next(new HttpError(400, "Validation failed", details));
        return;
      }
      next(err);
    }
  };
