import { apiClient } from './client'
import type { SchemaDefinition } from '@/types'

interface GenerateQueryResult {
  sql: string
  explanation: string
}

interface OptimizeResult {
  optimizedSql: string
  changes: string[]
  explanation: string
}

interface TranslateResult {
  translatedSql: string
  notes: string[]
}

export async function generateQueryRemote(
  prompt: string,
  schema: SchemaDefinition,
  target: string
): Promise<GenerateQueryResult> {
  const { data } = await apiClient.post<{ result: GenerateQueryResult }>('/api/query/generate', {
    prompt, schema, target,
  })
  return data.result
}

export async function optimizeQueryRemote(sql: string, target: string): Promise<OptimizeResult> {
  const { data } = await apiClient.post<{ result: OptimizeResult }>('/api/query/optimize', { sql, target })
  return data.result
}

export async function translateQueryRemote(
  sql: string,
  fromTarget: string,
  toTarget: string
): Promise<TranslateResult> {
  const { data } = await apiClient.post<{ result: TranslateResult }>('/api/query/translate', {
    sql, fromTarget, toTarget,
  })
  return data.result
}
