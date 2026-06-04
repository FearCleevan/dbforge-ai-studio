import { apiClient } from './client'
import { SchemaVersion } from '@/types/collaboration'

export async function listVersions(projectId: string): Promise<SchemaVersion[]> {
  const { data } = await apiClient.get<{ versions: SchemaVersion[] }>(`/api/versions/project/${projectId}`)
  return data.versions
}

export async function getVersion(projectId: string, version: number): Promise<SchemaVersion> {
  const { data } = await apiClient.get<{ version: SchemaVersion }>(`/api/versions/project/${projectId}/${version}`)
  return data.version
}

export async function revertToVersion(projectId: string, version: number): Promise<{ newVersion: number }> {
  const { data } = await apiClient.post<{ newVersion: number }>(
    `/api/versions/project/${projectId}/${version}/revert`
  )
  return data
}

export function getMigrationSQLUrl(projectId: string, version: number): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'
  return `${base}/api/versions/project/${projectId}/${version}/sql`
}
