import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'

import { env } from './config/env'
import { generalLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import { sanitizeBody } from './middleware/sanitize'

import authRoutes       from './routes/auth.routes'
import projectRoutes    from './routes/project.routes'
import schemaRoutes     from './routes/schema.routes'
import queryRoutes      from './routes/query.routes'
import connectionRoutes from './routes/connection.routes'
import apiRoutes        from './routes/api.routes'
import workspaceRoutes    from './routes/workspace.routes'
import versionRoutes      from './routes/version.routes'
import commentRoutes      from './routes/comment.routes'
import collectionRoutes   from './routes/collection.routes'

const app = express()

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      env.frontendUrl,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Request processing ────────────────────────────────────────────────────────
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(sanitizeBody)

// ── Logging ───────────────────────────────────────────────────────────────────
if (!env.isProd) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(generalLimiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health',      (_req, res) => res.json({ status: 'ok' }))
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv, timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/projects',   projectRoutes)
app.use('/api/schema',     schemaRoutes)
app.use('/api/query',      queryRoutes)
app.use('/api/connections', connectionRoutes)
app.use('/api/request',    apiRoutes)
app.use('/api/workspaces',   workspaceRoutes)
app.use('/api/versions',    versionRoutes)
app.use('/api/comments',    commentRoutes)
app.use('/api/collections', collectionRoutes)

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'Route not found' })
})

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler)

export default app
