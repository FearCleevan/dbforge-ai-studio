import mongoose, { Document, Schema } from 'mongoose'

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface IWorkspaceMember extends Document {
  _id: mongoose.Types.ObjectId
  workspaceId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  role: MemberRole
  invitedEmail?: string
  createdAt: Date
  updatedAt: Date
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId:  { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    userId:       { type: Schema.Types.ObjectId, ref: 'User' },
    role:         { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], required: true },
    invitedEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
)

WorkspaceMemberSchema.index({ workspaceId: 1, invitedEmail: 1 }, { unique: true, sparse: true })

export const WorkspaceMember = mongoose.model<IWorkspaceMember>('WorkspaceMember', WorkspaceMemberSchema)
