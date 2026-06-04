import { Response } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Comment } from '../models/Comment'
import { AuthRequest } from '../middleware/auth'

const CreateCommentSchema = z.object({
  targetType: z.enum(['table', 'column', 'query', 'api']),
  targetId:   z.string().min(1),
  body:       z.string().min(1).max(2000),
})

const ReplySchema = z.object({
  body: z.string().min(1).max(2000),
})

export async function listComments(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const { targetType, targetId } = req.query
  const filter: Record<string, unknown> = { projectId }
  if (targetType) filter.targetType = targetType
  if (targetId)   filter.targetId   = targetId
  const comments = await Comment.find(filter).sort({ createdAt: -1 })
  res.json({ comments })
}

export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const parsed = CreateCommentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const comment = await Comment.create({
    projectId,
    targetType: parsed.data.targetType,
    targetId:   parsed.data.targetId,
    body:       parsed.data.body,
    resolved:   false,
    replies:    [],
    createdBy:  new mongoose.Types.ObjectId(req.userId),
  })

  res.status(201).json({ comment })
}

export async function addReply(req: AuthRequest, res: Response): Promise<void> {
  const { commentId } = req.params
  const parsed = ReplySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation Error', details: parsed.error.flatten() })
    return
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $push: {
        replies: {
          userId:    new mongoose.Types.ObjectId(req.userId),
          body:      parsed.data.body,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  )

  if (!comment) {
    res.status(404).json({ error: 'Not Found', message: 'Comment not found' })
    return
  }

  res.json({ comment })
}

export async function toggleResolve(req: AuthRequest, res: Response): Promise<void> {
  const { commentId } = req.params
  const comment = await Comment.findById(commentId)
  if (!comment) {
    res.status(404).json({ error: 'Not Found', message: 'Comment not found' })
    return
  }
  comment.resolved = !comment.resolved
  await comment.save()
  res.json({ comment })
}

export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  const { commentId } = req.params
  const comment = await Comment.findByIdAndDelete(commentId)
  if (!comment) {
    res.status(404).json({ error: 'Not Found', message: 'Comment not found' })
    return
  }
  res.json({ message: 'Comment deleted' })
}

export async function getCommentCounts(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params
  const counts = await Comment.aggregate([
    { $match: { projectId, targetType: 'table' } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } },
  ])
  const result: Record<string, number> = {}
  for (const c of counts) result[c._id as string] = c.count as number
  res.json({ counts: result })
}
