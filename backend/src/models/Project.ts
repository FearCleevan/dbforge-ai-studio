import mongoose, { Document, Schema } from 'mongoose'

// ── Sub-schemas matching the frontend TypeScript types ────────────────────────

const KeyValuePairSchema = new Schema({
  id:      { type: String, required: true },
  key:     { type: String, default: '' },
  value:   { type: String, default: '' },
  enabled: { type: Boolean, default: true },
}, { _id: false })

const ColumnDefinitionSchema = new Schema({
  id:           { type: String, required: true },
  name:         { type: String, required: true },
  type:         { type: String, required: true },
  length:       { type: Number },
  nullable:     { type: Boolean, default: true },
  primaryKey:   { type: Boolean, default: false },
  unique:       { type: Boolean, default: false },
  defaultValue: { type: String },
  references:   { table: String, column: String },
  comment:      { type: String },
}, { _id: false })

const IndexDefinitionSchema = new Schema({
  id:      { type: String, required: true },
  name:    { type: String, required: true },
  columns: [String],
  unique:  { type: Boolean, default: false },
}, { _id: false })

const TableDefinitionSchema = new Schema({
  id:       { type: String, required: true },
  name:     { type: String, required: true },
  columns:  [ColumnDefinitionSchema],
  indexes:  [IndexDefinitionSchema],
  comment:  { type: String },
  position: { x: Number, y: Number },
}, { _id: false })

const SchemaDefinitionSchema = new Schema({
  id:           { type: String, required: true },
  name:         { type: String, required: true },
  target:       { type: String, required: true },
  tables:       [TableDefinitionSchema],
  ddl:          { type: String },
  nosqlSchema:  { type: Schema.Types.Mixed },
  explanation:  { type: String },
  createdAt:    { type: String },
  updatedAt:    { type: String },
}, { _id: false })

const SavedSchemaSchema = new Schema({
  id:      { type: String, required: true },
  name:    { type: String, required: true },
  schema:  { type: Schema.Types.Mixed, required: true },
  savedAt: { type: String, required: true },
}, { _id: false })

const QueryDefinitionSchema = new Schema({
  id:        { type: String, required: true },
  name:      { type: String },
  sql:       { type: String, required: true },
  createdAt: { type: String, required: true },
}, { _id: false })

const APIRequestSchema = new Schema({
  id:        { type: String, required: true },
  name:      { type: String },
  method:    { type: String, required: true },
  url:       { type: String, default: '' },
  headers:   [KeyValuePairSchema],
  params:    [KeyValuePairSchema],
  body:      { type: String },
  bodyType:  { type: String, default: 'json' },
  authType:  { type: String, default: 'none' },
  authValue: { type: String },
}, { _id: false })

const APIEnvironmentSchema = new Schema({
  id:        { type: String, required: true },
  name:      { type: String, required: true },
  variables: [KeyValuePairSchema],
}, { _id: false })

const NamingConventionSchema = new Schema({
  tableCase:  { type: String, default: 'snake_case' },
  columnCase: { type: String, default: 'snake_case' },
  prefix:     { type: String },
  suffix:     { type: String },
}, { _id: false })

// ── Project document ──────────────────────────────────────────────────────────

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  id: string
  name: string
  description?: string
  schemaData?: unknown
  savedSchemas: unknown[]
  queries: unknown[]
  apiRequests: unknown[]
  environments: unknown[]
  namingConvention: unknown
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    id:               { type: String, required: true, index: true },
    name:             { type: String, required: true, trim: true },
    description:      { type: String },
    schemaData:       SchemaDefinitionSchema,
    savedSchemas:     [SavedSchemaSchema],
    queries:          [QueryDefinitionSchema],
    apiRequests:      [APIRequestSchema],
    environments:     [APIEnvironmentSchema],
    namingConvention: NamingConventionSchema,
  },
  { timestamps: true }
)

ProjectSchema.index({ userId: 1, id: 1 }, { unique: true })

export const Project = mongoose.model<IProject>('Project', ProjectSchema)
