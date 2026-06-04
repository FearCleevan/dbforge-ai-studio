import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env'

const genAI = new GoogleGenerativeAI(env.geminiKey)
const MODEL = 'gemini-2.0-flash'

function getModel(systemInstruction: string) {
  return genAI.getGenerativeModel({ model: MODEL, systemInstruction })
}

// ── Schema Generation ─────────────────────────────────────────────────────────

export interface GenerateSchemaOptions {
  prompt: string
  target: string
  namingConvention?: { tableCase?: string; columnCase?: string; prefix?: string; suffix?: string }
}

export async function generateSchema(opts: GenerateSchemaOptions): Promise<string> {
  const { prompt, target, namingConvention } = opts

  const namingInstructions = namingConvention
    ? `Naming conventions: table case=${namingConvention.tableCase ?? 'snake_case'}, column case=${namingConvention.columnCase ?? 'snake_case'}${namingConvention.prefix ? `, prefix=${namingConvention.prefix}` : ''}${namingConvention.suffix ? `, suffix=${namingConvention.suffix}` : ''}.`
    : ''

  const systemPrompt = `You are a database schema expert. Generate a complete, production-ready database schema as JSON.

Return ONLY a valid JSON object matching this exact structure — no markdown, no explanation:
{
  "id": "<uuid>",
  "name": "<schema name>",
  "target": "${target}",
  "tables": [
    {
      "id": "<uuid>",
      "name": "<table name>",
      "columns": [
        {
          "id": "<uuid>",
          "name": "<column name>",
          "type": "<SQL type>",
          "nullable": <boolean>,
          "primaryKey": <boolean>,
          "unique": <boolean>,
          "defaultValue": "<string or null>",
          "references": { "table": "<name>", "column": "<name>" } | null,
          "comment": "<string or null>"
        }
      ],
      "indexes": [],
      "comment": "<table purpose>",
      "position": { "x": <number>, "y": <number> }
    }
  ],
  "ddl": "<full CREATE TABLE DDL statements>",
  "explanation": "<brief explanation of design decisions>"
}

Rules:
- Every table must have a primary key column named 'id' of type UUID or SERIAL.
- Use proper foreign key references for relationships.
- Generate realistic, complete schemas — don't leave tables half-done.
- Position tables in a readable grid layout (x: 0/400/800, y: 0/300/600).
- DDL must be valid ${target} syntax.
${namingInstructions}`

  const model = getModel(systemPrompt)
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

// ── Query Generation ──────────────────────────────────────────────────────────

export interface GenerateQueryOptions {
  prompt: string
  schema: unknown
  target: string
}

export async function generateQuery(opts: GenerateQueryOptions): Promise<string> {
  const { prompt, schema, target } = opts

  const systemPrompt = `You are a SQL expert. Given a database schema and a natural-language request, generate the optimal SQL query.

Return ONLY a JSON object — no markdown, no explanation:
{
  "sql": "<the SQL query>",
  "explanation": "<brief explanation of what this query does and why>"
}

Rules:
- Write clean, readable SQL with proper indentation.
- Use aliases for readability in complex queries.
- Add comments for non-obvious logic.
- Optimize for the ${target} query engine.
- Use only tables and columns that exist in the schema.`

  const model = getModel(systemPrompt)
  const result = await model.generateContent(
    `Schema:\n${JSON.stringify(schema, null, 2)}\n\nRequest: ${prompt}`
  )
  return result.response.text().trim()
}

// ── Query Optimization ────────────────────────────────────────────────────────

export async function optimizeQuery(sql: string, target: string): Promise<string> {
  const systemPrompt = `You are a database performance expert. Analyze the given SQL query and return an optimized version.

Return ONLY a JSON object — no markdown:
{
  "optimizedSql": "<the optimized query>",
  "changes": ["<change 1>", "<change 2>"],
  "explanation": "<summary of optimizations applied>"
}`

  const model = getModel(systemPrompt)
  const result = await model.generateContent(`Target: ${target}\n\nSQL:\n${sql}`)
  return result.response.text().trim()
}

// ── Query Translation ─────────────────────────────────────────────────────────

export async function translateQuery(sql: string, fromTarget: string, toTarget: string): Promise<string> {
  const systemPrompt = `You are a SQL dialect expert. Translate the given SQL query from ${fromTarget} to ${toTarget} syntax.

Return ONLY a JSON object — no markdown:
{
  "translatedSql": "<the translated query>",
  "notes": ["<compatibility note 1>", "<compatibility note 2>"]
}`

  const model = getModel(systemPrompt)
  const result = await model.generateContent(`SQL (${fromTarget}):\n${sql}`)
  return result.response.text().trim()
}

// ── Schema Validation ─────────────────────────────────────────────────────────

export async function validateSchema(schema: unknown, target: string): Promise<string> {
  const systemPrompt = `You are a database schema reviewer. Analyze the schema for issues, anti-patterns, and improvements.

Return ONLY a JSON object — no markdown:
{
  "valid": <boolean>,
  "issues": [
    { "severity": "error|warning|info", "table": "<name or null>", "column": "<name or null>", "message": "<description>" }
  ],
  "suggestions": ["<improvement 1>", "<improvement 2>"]
}`

  const model = getModel(systemPrompt)
  const result = await model.generateContent(`Target: ${target}\n\nSchema:\n${JSON.stringify(schema, null, 2)}`)
  return result.response.text().trim()
}
