import { SchemaDefinition } from './schema'

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type CommentTargetType = 'table' | 'column' | 'query' | 'api'

export interface Workspace {
  _id: string
  name: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  _id: string
  workspaceId: string
  userId?: { _id: string; name: string; email: string } | string
  role: MemberRole
  invitedEmail?: string
  createdAt: string
}

export interface ProjectShare {
  _id: string
  projectId: string
  workspaceId: string
  permissions: ('read' | 'write')[]
  shareToken?: string
  linkSharingEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface SchemaVersion {
  _id: string
  projectId: string
  version: number
  schemaSnapshot?: SchemaDefinition
  diffSummary: string
  migrationSQL: string
  createdBy: string
  createdAt: string
}

export interface CommentReply {
  _id: string
  userId: string
  body: string
  createdAt: string
}

export interface Comment {
  _id: string
  projectId: string
  targetType: CommentTargetType
  targetId: string
  body: string
  resolved: boolean
  replies: CommentReply[]
  createdBy: string
  createdAt: string
  updatedAt: string
}
