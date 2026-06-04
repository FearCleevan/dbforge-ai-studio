import { Schema, model, Document, Types } from 'mongoose'

export type DbDriver = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb'

export interface IConnection extends Document {
  userId:    Types.ObjectId
  name:      string
  driver:    DbDriver
  host?:     string
  port?:     number
  database:  string
  username?: string
  password?: string
  ssl:       boolean
  filePath?: string
  status:    'connected' | 'error' | 'unknown'
  createdAt: Date
  updatedAt: Date
}

const ConnectionSchema = new Schema<IConnection>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:     { type: String, required: true, trim: true },
  driver:   { type: String, enum: ['postgresql', 'mysql', 'sqlite', 'mongodb'], required: true },
  host:     { type: String },
  port:     { type: Number },
  database: { type: String, required: true },
  username: { type: String },
  password: { type: String, select: false },
  ssl:      { type: Boolean, default: false },
  filePath: { type: String },
  status:   { type: String, enum: ['connected', 'error', 'unknown'], default: 'unknown' },
}, { timestamps: true })

export const Connection = model<IConnection>('Connection', ConnectionSchema)
