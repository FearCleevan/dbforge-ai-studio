import mongoose, { Document, Schema } from 'mongoose'

export interface ICollection extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  workspaceId?: mongoose.Types.ObjectId
  name: string
  description?: string
  requests: unknown[]
  createdAt: Date
  updatedAt: Date
}

const CollectionSchema = new Schema<ICollection>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    name:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    requests:    { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const Collection = mongoose.model<ICollection>('Collection', CollectionSchema)
