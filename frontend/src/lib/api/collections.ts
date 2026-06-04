import { apiClient } from './client'
import { APICollection, APIRequest, CollectionRunSummary, DBAssertionResult } from '@/types'

export async function listCollections(): Promise<APICollection[]> {
  const { data } = await apiClient.get<{ collections: APICollection[] }>('/api/collections')
  return data.collections
}

export async function getCollection(id: string): Promise<APICollection> {
  const { data } = await apiClient.get<{ collection: APICollection }>(`/api/collections/${id}`)
  return data.collection
}

export async function createCollection(name: string, description?: string, requests?: APIRequest[]): Promise<APICollection> {
  const { data } = await apiClient.post<{ collection: APICollection }>('/api/collections', {
    name,
    description,
    requests: requests ?? [],
  })
  return data.collection
}

export async function updateCollection(id: string, updates: Partial<APICollection>): Promise<APICollection> {
  const { data } = await apiClient.put<{ collection: APICollection }>(`/api/collections/${id}`, updates)
  return data.collection
}

export async function deleteCollection(id: string): Promise<void> {
  await apiClient.delete(`/api/collections/${id}`)
}

export async function runCollection(id: string): Promise<CollectionRunSummary> {
  const { data } = await apiClient.post<CollectionRunSummary>(`/api/collections/${id}/run`)
  return data
}

export async function runDBQuery(
  connectionId: string,
  query: string
): Promise<DBAssertionResult> {
  try {
    const { data } = await apiClient.post<{ result: { rows: unknown[]; rowCount: number } }>(
      `/api/collections/connections/${connectionId}/query`,
      { query }
    )
    const rowCount = data.result.rowCount ?? (data.result.rows?.length ?? 0)
    return {
      success:  rowCount > 0,
      rowCount,
      message:  rowCount > 0
        ? `✔ ${rowCount} record${rowCount > 1 ? 's' : ''} confirmed in database`
        : '✗ Record not found in database',
    }
  } catch (err: unknown) {
    return { success: false, rowCount: 0, message: `✗ DB query failed: ${(err as Error).message}` }
  }
}
