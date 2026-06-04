import { v4 as uuidv4 } from 'uuid'
import { SchemaDefinition, DatabaseTarget, NamingConvention } from '@/types'
import { mockSchemas } from '@/lib/mock/schemas'
import { generateDDL, generateMongoSchema, applyNamingConvention } from '@/lib/utils/schemaHelpers'
import { AI_KEYWORDS } from '@/lib/constants'

const EXPLANATIONS: Record<string, string> = {
  'e-commerce': 'A comprehensive e-commerce schema designed for scalability. Users are linked to orders via foreign keys, products are categorized and tracked with SKUs, and the cart system supports multi-item sessions. Reviews and addresses are tied to users for a complete customer profile.',
  'blog': 'A full-featured blogging platform schema. Posts support drafts and scheduled publishing, tags are normalized into a many-to-many join table, and comments support threaded replies via a self-referencing parent_id. Media uploads are tracked separately for flexibility.',
  'inventory': 'An inventory management schema optimized for multi-warehouse operations. Stock levels are tracked per product per warehouse, purchase orders link suppliers to specific warehouses, and the transactions table creates a full audit trail of all stock movements.',
  'saas': 'A multi-tenant SaaS schema with organization-level isolation. Memberships handle the many-to-many between users and organizations with role-based access, plans define feature entitlements, and usage_logs capture granular activity for billing and analytics.',
  'social-network': 'A social network schema built for high read throughput. Follows use a composite primary key to enforce uniqueness, denormalized counts on posts reduce join overhead, and the notifications system supports rich activity feeds with actor/recipient tracking.',
}

function scoreTemplate(prompt: string): string {
  const lower = prompt.toLowerCase()
  let bestTemplate = 'e-commerce'
  let bestScore = 0

  for (const [template, keywords] of Object.entries(AI_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestTemplate = template
    }
  }

  return bestTemplate
}

function applyConventions(schema: SchemaDefinition, convention: NamingConvention): SchemaDefinition {
  return {
    ...schema,
    tables: schema.tables.map(table => ({
      ...table,
      name: applyNamingConvention(table.name, convention.tableCase, convention.prefix, convention.suffix),
      columns: table.columns.map(col => ({
        ...col,
        name: applyNamingConvention(col.name, convention.columnCase),
        references: col.references
          ? {
              table: applyNamingConvention(col.references.table, convention.tableCase, convention.prefix, convention.suffix),
              column: applyNamingConvention(col.references.column, convention.columnCase),
            }
          : undefined,
      })),
    })),
  }
}

export async function simulateSchemaGeneration(
  prompt: string,
  target: DatabaseTarget,
  convention: NamingConvention
): Promise<SchemaDefinition> {
  const delay = Math.random() * 600 + 400
  await new Promise(resolve => setTimeout(resolve, delay))

  const templateKey = scoreTemplate(prompt)
  const baseSchema = mockSchemas[templateKey] ?? mockSchemas['e-commerce']

  const now = new Date().toISOString()
  let schema: SchemaDefinition = {
    ...baseSchema,
    id: uuidv4(),
    name: prompt.slice(0, 60) || baseSchema.name,
    target,
    createdAt: now,
    updatedAt: now,
    explanation: EXPLANATIONS[templateKey] ?? EXPLANATIONS['e-commerce'],
    tables: baseSchema.tables.map(t => ({ ...t, id: uuidv4(), columns: t.columns.map(c => ({ ...c, id: uuidv4() })) })),
  }

  schema = applyConventions(schema, convention)
  schema.ddl = generateDDL(schema)

  if (target === 'mongodb' || target === 'firestore') {
    schema.nosqlSchema = generateMongoSchema(schema)
  }

  return schema
}
