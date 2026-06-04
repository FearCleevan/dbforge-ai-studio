import { apiClient } from './client'
import { DbConnection, ConnectionConfig, TestResult } from '@/types/connection'
import type { SchemaDefinition } from '@/types'

export const connectionsAPI = {
  list(): Promise<DbConnection[]> {
    return apiClient
      .get<{ connections: DbConnection[] }>('/api/connections')
      .then(r => r.data.connections)
  },

  create(config: ConnectionConfig): Promise<DbConnection> {
    return apiClient
      .post<{ connection: DbConnection }>('/api/connections', config)
      .then(r => r.data.connection)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/connections/${id}`).then(() => undefined)
  },

  test(config: ConnectionConfig): Promise<TestResult> {
    return apiClient
      .post<TestResult>('/api/connections/test', config)
      .then(r => r.data)
      .catch(err => ({
        success: false,
        message: (err.response?.data?.message as string) ?? 'Connection failed',
      }))
  },

  reverseEngineer(id: string): Promise<SchemaDefinition> {
    return apiClient
      .post<{ schema: SchemaDefinition }>(`/api/connections/${id}/reverse`)
      .then(r => r.data.schema)
  },
}
