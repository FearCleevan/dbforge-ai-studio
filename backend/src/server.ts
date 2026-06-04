import { connectDB } from './config/db'
import { env } from './config/env'
import app from './app'

async function bootstrap() {
  await connectDB()

  const server = app.listen(env.port, () => {
    console.log(`[server] DBForge AI Studio API running on port ${env.port} (${env.nodeEnv})`)
  })

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} received — shutting down gracefully`)
    server.close(() => {
      console.log('[server] HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

bootstrap().catch(err => {
  console.error('[server] Bootstrap failed:', err)
  process.exit(1)
})
