import { Response } from 'express'
import mongoose from 'mongoose'
import { SchemaVersion } from '../models/SchemaVersion'
import { Project } from '../models/Project'
import { AuthRequest } from '../middleware/auth'
import { computeDiffSummary, generateMigrationSQL } from '../services/version.service'
import { SchemaDefinition } from '../types/schema'

export async function listVersions(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const versions = await SchemaVersion.find({ projectId })
    .select('-schema')
    .sort({ version: -1 })
    .limit(50)
  res.json({ versions })
}

export async function getVersion(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, version } = req.params
  const doc = await SchemaVersion.findOne({ projectId, version: parseInt(version, 10) })
  if (!doc) {
    res.status(404).json({ error: 'Not Found', message: 'Version not found' })
    return
  }
  res.json({ version: doc })
}

export async function downloadMigrationSQL(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, version } = req.params
  const doc = await SchemaVersion.findOne({ projectId, version: parseInt(version, 10) })
  if (!doc) {
    res.status(404).json({ error: 'Not Found', message: 'Version not found' })
    return
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="migration_v${version}.sql"`)
  res.send(doc.migrationSQL || '-- No migration SQL available')
}

export async function revertToVersion(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, version } = req.params

  const targetVersion = await SchemaVersion.findOne({ projectId, version: parseInt(version, 10) })
  if (!targetVersion) {
    res.status(404).json({ error: 'Not Found', message: 'Version not found' })
    return
  }

  // Get the current project schema for diff
  const project = await Project.findOne({ userId: req.userId, id: projectId })
  if (!project) {
    res.status(404).json({ error: 'Not Found', message: 'Project not found' })
    return
  }

  const prevSchema = project.schemaData as SchemaDefinition | undefined
  const newSchema = targetVersion.schemaSnapshot as unknown as SchemaDefinition

  // Get next version number
  const latest = await SchemaVersion.findOne({ projectId }).sort({ version: -1 })
  const nextVersion = (latest?.version ?? 0) + 1

  await SchemaVersion.create({
    projectId,
    version:        nextVersion,
    schemaSnapshot: newSchema,
    diffSummary:    `Reverted to v${version} — ${computeDiffSummary(prevSchema ?? null, newSchema)}`,
    migrationSQL:   generateMigrationSQL(prevSchema ?? null, newSchema),
    createdBy:      new mongoose.Types.ObjectId(req.userId),
  })

  await Project.findOneAndUpdate(
    { userId: req.userId, id: projectId },
    { $set: { schemaData: newSchema } }
  )

  res.json({ message: `Reverted to version ${version}`, newVersion: nextVersion })
}
