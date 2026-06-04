import rateLimit from 'express-rate-limit'

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too Many Requests', message: 'Rate limit exceeded. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too Many Requests', message: 'AI rate limit exceeded. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too Many Requests', message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
