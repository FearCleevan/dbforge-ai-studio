import { Request, Response, NextFunction } from 'express'

function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') {
    return val
      .replace(/\0/g, '')                          // null bytes
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // script tags
      .replace(/javascript:/gi, '')                // js: protocol
      .trim()
  }
  if (Array.isArray(val)) return val.map(sanitizeValue)
  if (val !== null && typeof val === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = sanitizeValue(v)
    }
    return out
  }
  return val
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body)
  }
  next()
}
