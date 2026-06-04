import { Response } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import { Project, IProject } from '../models/Project'
import { SchemaVersion } from '../models/SchemaVersion'
import { AuthRequest } from '../middleware/auth'
import { computeDiffSummary, generateMigrationSQL } from '../services/version.service'
import { SchemaDefinition } from '../types/schema'

const CreateProjectSchema = z.object({
  id:               z.string().optional(),
  name:             z.string().min(1).max(100),
  description:      z.string().max(500).optional(),
  schema:           z.unknown().optional(),
  savedSchemas:     z.array(z.unknown()).optional(),
  queries:          z.array(z.unknown()).optional(),
  apiRequests:      z.array(z.unknown()).optional(),
  environments:     z.array(z.unknown()).optional(),
  namingConvention: z.unknown().optional(),
})

const UpdateProjectSchema = CreateProjectSchema.partial()

// Map Mongoose doc → frontend shape (schemaData → schema)
function toClientProject(doc: IProject) {
  const obj = doc.toObject({ versionKey: false })
  const { schemaData, _id, userId, ...rest } = obj
  return { ...rest, schema: schemaData ?? null }
}

export async function listProjects(req: AuthRequest, res: Response): Promise<void> {
  const projects = await Project.find({ userId: req.userId })
    .select('id name description createdAt updatedAt')
    .sort({ updatedAt: -1 })
  res.json({ projects })
}

export async function getProject(req: AuthRequest, res: Response): Promise<void> {
  const doc = await Project.findOne({ userId: req.userId, id: req.params.id })
  if (!doc) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' })
    return
  }
  res.json({ project: toClientProject(doc) })
}

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CreateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const data = parsed.data
  const id = data.id ?? uuidv4()

  const existing = await Project.findOne({ userId: req.userId, id })
  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Project with this ID already exists' })
    return
  }

  const doc = await Project.create({
    userId:           req.userId,
    id,
    name:             data.name,
    description:      data.description,
    schemaData:       data.schema,
    savedSchemas:     data.savedSchemas     ?? [],
    queries:          data.queries          ?? [],
    apiRequests:      data.apiRequests      ?? [],
    environments:     data.environments     ?? [],
    namingConvention: data.namingConvention ?? { tableCase: 'snake_case', columnCase: 'snake_case' },
  })

  res.status(201).json({ project: toClientProject(doc) })
}

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  const parsed = UpdateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const { schema, savedSchemas, ...rest } = parsed.data
  const updateFields: Record<string, unknown> = { ...rest }
  if (schema !== undefined)       updateFields['schemaData']    = schema
  if (savedSchemas !== undefined) updateFields['savedSchemas']  = savedSchemas

  // Fetch the current document before updating so we can diff the schema
  const existing = await Project.findOne({ userId: req.userId, id: req.params.id })
  if (!existing) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' })
    return
  }

  const prevSchema = existing.schemaData as SchemaDefinition | undefined

  const doc = await Project.findOneAndUpdate(
    { userId: req.userId, id: req.params.id },
    { $set: updateFields },
    { new: true, runValidators: true }
  )

  if (!doc) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' })
    return
  }

  // Auto-version when the schema changes
  if (schema !== undefined && schema !== null) {
    const newSchema = schema as SchemaDefinition
    const latest = await SchemaVersion.findOne({ projectId: req.params.id }).sort({ version: -1 })
    const nextVersion = (latest?.version ?? 0) + 1
    await SchemaVersion.create({
      projectId:      req.params.id,
      version:        nextVersion,
      schemaSnapshot: newSchema,
      diffSummary:    computeDiffSummary(prevSchema ?? null, newSchema),
      migrationSQL:   generateMigrationSQL(prevSchema ?? null, newSchema),
      createdBy:    new mongoose.Types.ObjectId(req.userId),
    }).catch(() => { /* non-fatal: version creation shouldn't block project save */ })
  }

  res.json({ project: toClientProject(doc) })
}

export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  const project = await Project.findOneAndDelete({ userId: req.userId, id: req.params.id })
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' })
    return
  }
  res.json({ message: 'Project deleted' })
}
