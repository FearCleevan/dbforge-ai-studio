import mongoose from 'mongoose'
import { env } from './env'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri, {
      maxPoolSize: 10,
    })
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    console.error('[db] Connection failed:', err)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected — retrying...')
  })
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB error:', err)
  })
}
