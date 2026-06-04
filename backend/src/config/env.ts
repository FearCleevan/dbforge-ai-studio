import dotenv from 'dotenv'
dotenv.config()

function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback
  if (!val) {
    console.error(`[env] Missing required environment variable: ${key}`)
    process.exit(1)
  }
  return val
}

export const env = {
  port:           parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:        process.env.NODE_ENV ?? 'development',
  mongoUri:       requireEnv('MONGODB_URI'),
  jwtSecret:      requireEnv('JWT_SECRET'),
  jwtExpiresIn:   process.env.JWT_EXPIRES_IN ?? '7d',
  geminiKey:      requireEnv('GEMINI_API_KEY'),
  frontendUrl:    process.env.FRONTEND_URL ?? 'http://localhost:5173',
  isProd:         process.env.NODE_ENV === 'production',
} as const
