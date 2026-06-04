import mongoose, { Document, Schema } from 'mongoose'

export interface IProjectShare extends Document {
  _id: mongoose.Types.ObjectId
  projectId: string
  workspaceId: mongoose.Types.ObjectId
  permissions: ('read' | 'write')[]
  shareToken?: string
  linkSharingEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const ProjectShareSchema = new Schema<IProjectShare>(
  {
    projectId:          { type: String, required: true, index: true },
    workspaceId:        { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    permissions:        [{ type: String, enum: ['read', 'write'] }],
    shareToken:         { type: String, index: true, sparse: true },
    linkSharingEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ProjectShareSchema.index({ projectId: 1, workspaceId: 1 }, { unique: true })

export const ProjectShare = mongoose.model<IProjectShare>('ProjectShare', ProjectShareSchema)
