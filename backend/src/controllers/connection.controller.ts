import { Response } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { Connection } from '../models/Connection'
import { testConnection, reverseEngineerSchema } from '../services/dbConnector.service'

const ConnectionSchema = z.object({
  name:     z.string().min(1).max(100),
  driver:   z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']),
  host:     z.string().optional(),
  port:     z.number().int().positive().optional(),
  database: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl:      z.boolean().default(false),
  filePath: z.string().optional(),
})

export async function listConnections(req: AuthRequest, res: Response): Promise<void> {
  const connections = await Connection
    .find({ userId: req.userId })
    .select('-password')
    .sort({ createdAt: -1 })
  res.json({ connections })
}

export async function createConnection(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ConnectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }
  const conn = await Connection.create({ ...parsed.data, userId: req.userId, status: 'unknown' })
  const obj  = conn.toObject() as unknown as Record<string, unknown>
  delete obj['password']
  res.status(201).json({ connection: obj })
}

export async function deleteConnection(req: AuthRequest, res: Response): Promise<void> {
  const conn = await Connection.findOne({ _id: req.params.id, userId: req.userId })
  if (!conn) { res.status(404).json({ error: 'Not Found' }); return }
  await conn.deleteOne()
  res.json({ message: 'Connection deleted' })
}

export async function testConnectionEndpoint(req: AuthRequest, res: Response): Promise<void> {
  const parsed = ConnectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }
  try {
    const tempConn = new Connection({ ...parsed.data, userId: req.userId })
    await testConnection(tempConn)
    res.json({ success: true, message: 'Connection successful' })
  } catch (err: unknown) {
    res.status(422).json({ success: false, message: (err as Error).message })
  }
}

export async function reverseEngineerEndpoint(req: AuthRequest, res: Response): Promise<void> {
  const conn = await Connection.findOne({ _id: req.params.id, userId: req.userId }).select('+password')
  if (!conn) { res.status(404).json({ error: 'Not Found' }); return }
  try {
    const schema = await reverseEngineerSchema(conn)
    res.json({ schema })
  } catch (err: unknown) {
    res.status(422).json({ error: 'Reverse engineer failed', message: (err as Error).message })
  }
}
