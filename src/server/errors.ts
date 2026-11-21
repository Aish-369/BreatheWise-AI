import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ path: string; message: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Array<{ path: string; message: string }>) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundApiHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `API endpoint not found: ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues[0]?.message ?? 'Validation failed.',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Malformed JSON request body.',
      code: 'INVALID_JSON',
    });
    return;
  }

  console.error('[BreatheWise API Error]', err instanceof Error ? err.message : err);
  res.status(500).json({
    error: 'Internal server error. Please try again.',
    code: 'INTERNAL_ERROR',
  });
}
