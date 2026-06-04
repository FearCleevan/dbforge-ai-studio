import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500
  const message = err.message ?? 'Internal Server Error'

  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err)
  }

  res.status(status).json({ error: status >= 500 ? 'Internal Server Error' : message, message })
}
