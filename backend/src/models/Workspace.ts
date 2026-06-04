import mongoose, { Document, Schema } from 'mongoose'

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  ownerId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    ownerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
)

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema)
