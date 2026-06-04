import { apiClient } from './client'
import type { Project } from '@/types'

interface ProjectListItem {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface ProjectListResponse {
  projects: ProjectListItem[]
}

interface ProjectResponse {
  project: Project
}

export async function fetchProjects(): Promise<ProjectListItem[]> {
  const { data } = await apiClient.get<ProjectListResponse>('/api/projects')
  return data.projects
}

export async function fetchProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<ProjectResponse>(`/api/projects/${id}`)
  return data.project
}

export async function createProjectRemote(project: Partial<Project>): Promise<Project> {
  const { data } = await apiClient.post<ProjectResponse>('/api/projects', project)
  return data.project
}

export async function updateProjectRemote(id: string, updates: Partial<Project>): Promise<Project> {
  const { data } = await apiClient.put<ProjectResponse>(`/api/projects/${id}`, updates)
  return data.project
}

export async function deleteProjectRemote(id: string): Promise<void> {
  await apiClient.delete(`/api/projects/${id}`)
}
