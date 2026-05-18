import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

interface AppError {
  error: string;
  code: string;
  details?: { field: string; message: string }[];
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err }, "Unhandled error");

  if (err.name === "ZodError") {
    const details = err.issues?.map((i: any) => ({
      field: i.path?.join(".") || "unknown",
      message: i.message,
    }));
    res.status(400).json({
      error: "Erro de validação nos dados enviados",
      code: "VALIDATION_ERROR",
      details,
    } satisfies AppError);
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Erro interno do servidor";
  const code = err.code || "INTERNAL";

  res.status(statusCode).json({
    error: message,
    code,
    details: err.details,
  } satisfies AppError);
}

// Helper to create typed errors
export class BusinessError extends Error {
  statusCode: number;
  code: string;
  details?: { field: string; message: string }[];

  constructor(
    message: string,
    statusCode: number = 422,
    code: string = "FORBIDDEN",
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
