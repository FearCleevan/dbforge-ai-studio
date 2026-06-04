import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthRequest extends Request {
  userId?: string
}

interface JwtPayload {
  userId: string
  iat: number
  exp: number
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'No token provided' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Token expired or invalid' })
  }
}
