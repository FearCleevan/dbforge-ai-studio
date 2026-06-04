import { apiClient } from './client'
import type { SchemaDefinition } from '@/types'

interface GenerateSchemaOptions {
  prompt: string
  target: string
  namingConvention?: {
    tableCase?: string
    columnCase?: string
    prefix?: string
    suffix?: string
  }
}

interface GenerateSchemaResponse {
  schema: SchemaDefinition
}

interface ValidateResult {
  valid: boolean
  issues: Array<{ severity: string; table?: string; column?: string; message: string }>
  suggestions: string[]
}

interface ValidateResponse {
  result: ValidateResult
}

export async function generateSchemaRemote(opts: GenerateSchemaOptions): Promise<SchemaDefinition> {
  const { data } = await apiClient.post<GenerateSchemaResponse>('/api/schema/generate', opts)
  return data.schema
}

export async function validateSchemaRemote(schema: SchemaDefinition, target: string): Promise<ValidateResult> {
  const { data } = await apiClient.post<ValidateResponse>('/api/schema/validate', { schema, target })
  return data.result
}

export async function importSchemaFromDb(connectionId: string): Promise<SchemaDefinition> {
  const { data } = await apiClient.post<{ schema: SchemaDefinition }>(`/api/connections/${connectionId}/reverse`)
  return data.schema
}
