import { Response } from 'express'
import { z } from 'zod'
import crypto from 'crypto'
import mongoose from 'mongoose'
import { Workspace } from '../models/Workspace'
import { WorkspaceMember } from '../models/WorkspaceMember'
import { ProjectShare } from '../models/ProjectShare'
import { User } from '../models/User'
import { AuthRequest } from '../middleware/auth'

const CreateWorkspaceSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const InviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['admin', 'editor', 'viewer']),
})

const ShareProjectSchema = z.object({
  workspaceId:        z.string(),
  permissions:        z.array(z.enum(['read', 'write'])).default(['read']),
  linkSharingEnabled: z.boolean().default(false),
})

export async function listWorkspaces(req: AuthRequest, res: Response): Promise<void> {
  const memberships = await WorkspaceMember.find({ userId: new mongoose.Types.ObjectId(req.userId) })
  const ids = memberships.map(m => m.workspaceId)
  const workspaces = await Workspace.find({ _id: { $in: ids } }).sort({ createdAt: -1 })
  res.json({ workspaces })
}

export async function createWorkspace(req: AuthRequest, res: Response): Promise<void> {
  const parsed = CreateWorkspaceSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const workspace = await Workspace.create({
    name:        parsed.data.name,
    description: parsed.data.description,
    ownerId:     new mongoose.Types.ObjectId(req.userId),
  })

  await WorkspaceMember.create({
    workspaceId:  workspace._id,
    userId:       new mongoose.Types.ObjectId(req.userId),
    role:         'owner',
  })

  res.status(201).json({ workspace })
}

export async function getWorkspaceMembers(req: AuthRequest, res: Response): Promise<void> {
  const { workspaceId } = req.params
  const members = await WorkspaceMember.find({ workspaceId })
    .populate('userId', 'name email')
    .sort({ createdAt: 1 })
  res.json({ members })
}

export async function inviteMember(req: AuthRequest, res: Response): Promise<void> {
  const { workspaceId } = req.params
  const parsed = InviteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const caller = await WorkspaceMember.findOne({
    workspaceId,
    userId: new mongoose.Types.ObjectId(req.userId),
  })
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    res.status(403).json({ error: 'Forbidden', message: 'Only owners and admins can invite members' })
    return
  }

  const user = await User.findOne({ email: parsed.data.email })
  const memberData: Record<string, unknown> = {
    workspaceId,
    role:         parsed.data.role,
    invitedEmail: parsed.data.email,
  }
  if (user) memberData.userId = user._id

  const member = await WorkspaceMember.findOneAndUpdate(
    { workspaceId, invitedEmail: parsed.data.email },
    { $set: memberData },
    { upsert: true, new: true }
  )

  res.json({ member })
}

export async function removeMember(req: AuthRequest, res: Response): Promise<void> {
  const { workspaceId, memberId } = req.params

  const caller = await WorkspaceMember.findOne({
    workspaceId,
    userId: new mongoose.Types.ObjectId(req.userId),
  })
  if (!caller || !['owner', 'admin'].includes(caller.role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  await WorkspaceMember.findByIdAndDelete(memberId)
  res.json({ message: 'Member removed' })
}

export async function shareProject(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const parsed = ShareProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const updateData: Record<string, unknown> = {
    projectId,
    workspaceId:        parsed.data.workspaceId,
    permissions:        parsed.data.permissions,
    linkSharingEnabled: parsed.data.linkSharingEnabled,
  }
  if (parsed.data.linkSharingEnabled) {
    updateData.shareToken = crypto.randomBytes(16).toString('hex')
  }

  const share = await ProjectShare.findOneAndUpdate(
    { projectId, workspaceId: parsed.data.workspaceId },
    { $set: updateData },
    { upsert: true, new: true }
  )

  res.json({ share })
}

export async function getProjectShare(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const share = await ProjectShare.findOne({ projectId })
  const members = share
    ? await WorkspaceMember.find({ workspaceId: share.workspaceId })
        .populate('userId', 'name email')
        .sort({ createdAt: 1 })
    : []
  res.json({ share, members })
}
