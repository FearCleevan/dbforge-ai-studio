import { Response } from 'express'
import { z } from 'zod'
import { Collection } from '../models/Collection'
import { Connection } from '../models/Connection'
import { executeQuery } from '../services/dbConnector.service'
import { AuthRequest } from '../middleware/auth'
import mongoose from 'mongoose'

const CollectionSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workspaceId: z.string().optional(),
  requests:    z.array(z.unknown()).default([]),
})

interface APIRequestItem {
  id:        string
  method:    string
  url:       string
  headers:   { key: string; value: string; enabled: boolean }[]
  params:    { key: string; value: string; enabled: boolean }[]
  body?:     string
  bodyType:  string
  authType:  string
  authValue?: string
}

export async function listCollections(req: AuthRequest, res: Response): Promise<void> {
  const collections = await Collection
    .find({ userId: new mongoose.Types.ObjectId(req.userId) })
    .select('-requests')
    .sort({ updatedAt: -1 })
  res.json({ collections })
}

export async function getCollection(req: AuthRequest, res: Response): Promise<void> {
  const col = await Collection.findOne({ _id: req.params.id, userId: req.userId })
  if (!col) { res.status(404).json({ error: 'Not Found' }); return }
  res.json({ collection: col })
}

export async function createCollection(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CollectionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const col = await Collection.create({
    userId:      new mongoose.Types.ObjectId(req.userId),
    workspaceId: parsed.data.workspaceId,
    name:        parsed.data.name,
    description: parsed.data.description,
    requests:    parsed.data.requests,
  })
  res.status(201).json({ collection: col })
}

export async function updateCollection(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CollectionSchema.partial().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }
  const col = await Collection.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: parsed.data },
    { new: true }
  )
  if (!col) { res.status(404).json({ error: 'Not Found' }); return }
  res.json({ collection: col })
}

export async function deleteCollection(req: AuthRequest, res: Response): Promise<void> {
  const col = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.userId })
  if (!col) { res.status(404).json({ error: 'Not Found' }); return }
  res.json({ message: 'Collection deleted' })
}

// Run all requests in a collection sequentially and return summary
export async function runCollection(req: AuthRequest, res: Response): Promise<void> {
  const col = await Collection.findOne({ _id: req.params.id, userId: req.userId })
  if (!col) { res.status(404).json({ error: 'Not Found' }); return }

  const axios = (await import('axios')).default
  const results: { id: string; name?: string; status: number; timeMs: number; error?: string }[] = []

  for (const rawReq of col.requests as APIRequestItem[]) {
    const start = Date.now()
    try {
      const headers: Record<string, string> = {}
      for (const h of rawReq.headers ?? []) {
        if (h.enabled && h.key) headers[h.key] = h.value
      }
      if (rawReq.authType === 'bearer' && rawReq.authValue) {
        headers['Authorization'] = `Bearer ${rawReq.authValue}`
      }

      const params: Record<string, string> = {}
      for (const p of rawReq.params ?? []) {
        if (p.enabled && p.key) params[p.key] = p.value
      }

      const r = await axios.request({
        method: rawReq.method,
        url:    rawReq.url,
        headers,
        params,
        data:   rawReq.body && rawReq.bodyType !== 'none' ? rawReq.body : undefined,
        timeout: 15000,
        validateStatus: () => true,
      })
      results.push({ id: rawReq.id, status: r.status, timeMs: Date.now() - start })
    } catch (err: unknown) {
      results.push({ id: rawReq.id, status: 0, timeMs: Date.now() - start, error: (err as Error).message })
    }
  }

  const passed = results.filter(r => r.status >= 200 && r.status < 300).length
  res.json({ results, summary: { total: results.length, passed, failed: results.length - passed } })
}

// Execute a DB query via a named connection — used for DB-backed assertions
export async function runConnectionQuery(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const { query } = req.body as { query?: string }
  if (!query?.trim()) {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const conn = await Connection.findOne({ _id: id, userId: req.userId }).select('+password')
  if (!conn) { res.status(404).json({ error: 'Not Found' }); return }

  try {
    const result = await executeQuery(conn, query)
    res.json({ result })
  } catch (err: unknown) {
    res.status(422).json({ error: 'Query failed', message: (err as Error).message })
  }
}
