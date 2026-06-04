import mongoose, { Document, Schema } from 'mongoose'

export interface ISchemaVersion extends Document {
  _id: mongoose.Types.ObjectId
  projectId: string
  version: number
  schemaSnapshot: unknown
  diffSummary: string
  migrationSQL: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
}

const SchemaVersionSchema = new Schema<ISchemaVersion>(
  {
    projectId:      { type: String, required: true, index: true },
    version:        { type: Number, required: true },
    schemaSnapshot: { type: Schema.Types.Mixed, required: true },
    diffSummary:  { type: String, default: '' },
    migrationSQL: { type: String, default: '' },
    createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

SchemaVersionSchema.index({ projectId: 1, version: 1 }, { unique: true })

export const SchemaVersion = mongoose.model<ISchemaVersion>('SchemaVersion', SchemaVersionSchema)
