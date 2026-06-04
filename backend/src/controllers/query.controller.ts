import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { generateQuery, optimizeQuery, translateQuery } from '../services/ai.service'
import { Connection } from '../models/Connection'
import { executeQuery } from '../services/dbConnector.service'

const GenerateQuerySchema = z.object({
  prompt: z.string().min(5).max(1000),
  schema: z.unknown(),
  target: z.string().min(1),
})

const OptimizeQuerySchema = z.object({
  sql:    z.string().min(1),
  target: z.string().min(1),
})

const TranslateQuerySchema = z.object({
  sql:        z.string().min(1),
  fromTarget: z.string().min(1),
  toTarget:   z.string().min(1),
})

export async function generate(req: AuthRequest, res: Response): Promise<void> {
  const parsed = GenerateQuerySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const raw = await generateQuery({
    prompt: parsed.data.prompt,
    schema: parsed.data.schema ?? {},
    target: parsed.data.target,
  })

  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    res.status(502).json({ error: 'AI Error', message: 'Failed to parse AI response as JSON', raw })
    return
  }

  res.json({ result })
}

export async function optimize(req: AuthRequest, res: Response): Promise<void> {
  const parsed = OptimizeQuerySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const raw = await optimizeQuery(parsed.data.sql, parsed.data.target)

  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    res.status(502).json({ error: 'AI Error', message: 'Failed to parse AI response as JSON', raw })
    return
  }

  res.json({ result })
}

export async function translate(req: AuthRequest, res: Response): Promise<void> {
  const parsed = TranslateQuerySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const raw = await translateQuery(parsed.data.sql, parsed.data.fromTarget, parsed.data.toTarget)

  let result: unknown
  try {
    result = JSON.parse(raw)
  } catch {
    res.status(502).json({ error: 'AI Error', message: 'Failed to parse AI response as JSON', raw })
    return
  }

  res.json({ result })
}

const ExecuteQuerySchema = z.object({
  connectionId: z.string().min(1),
  sql:          z.string().min(1),
})

export async function execute(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ExecuteQuerySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const conn = await Connection
    .findOne({ _id: parsed.data.connectionId, userId: req.userId })
    .select('+password')
  if (!conn) {
    res.status(404).json({ error: 'Connection not found' })
    return
  }

  const result = await executeQuery(conn, parsed.data.sql)
  res.json({ result })
}
