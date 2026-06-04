import { apiClient } from './client'
import { Comment, CommentTargetType } from '@/types/collaboration'

export async function listComments(
  projectId: string,
  targetType?: CommentTargetType,
  targetId?: string
): Promise<Comment[]> {
  const params: Record<string, string> = {}
  if (targetType) params.targetType = targetType
  if (targetId)   params.targetId   = targetId
  const { data } = await apiClient.get<{ comments: Comment[] }>(`/api/comments/project/${projectId}`, { params })
  return data.comments
}

export async function createComment(
  projectId: string,
  targetType: CommentTargetType,
  targetId: string,
  body: string
): Promise<Comment> {
  const { data } = await apiClient.post<{ comment: Comment }>(`/api/comments/project/${projectId}`, {
    targetType,
    targetId,
    body,
  })
  return data.comment
}

export async function addReply(commentId: string, body: string): Promise<Comment> {
  const { data } = await apiClient.post<{ comment: Comment }>(`/api/comments/${commentId}/reply`, { body })
  return data.comment
}

export async function toggleResolve(commentId: string): Promise<Comment> {
  const { data } = await apiClient.patch<{ comment: Comment }>(`/api/comments/${commentId}/resolve`)
  return data.comment
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/api/comments/${commentId}`)
}

export async function getCommentCounts(projectId: string): Promise<Record<string, number>> {
  const { data } = await apiClient.get<{ counts: Record<string, number> }>(
    `/api/comments/project/${projectId}/counts`
  )
  return data.counts
}
