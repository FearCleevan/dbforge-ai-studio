import mongoose, { Document, Schema } from 'mongoose'

interface IReply {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  body: string
  createdAt: Date
}

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId
  projectId: string
  targetType: 'table' | 'column' | 'query' | 'api'
  targetId: string
  body: string
  resolved: boolean
  replies: IReply[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ReplySchema = new Schema<IReply>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const CommentSchema = new Schema<IComment>(
  {
    projectId:  { type: String, required: true, index: true },
    targetType: { type: String, enum: ['table', 'column', 'query', 'api'], required: true },
    targetId:   { type: String, required: true },
    body:       { type: String, required: true, maxlength: 2000 },
    resolved:   { type: Boolean, default: false },
    replies:    [ReplySchema],
    createdBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

CommentSchema.index({ projectId: 1, targetType: 1, targetId: 1 })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
