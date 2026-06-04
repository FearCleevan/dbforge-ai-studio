import { apiClient } from './client'
import { Workspace, WorkspaceMember, ProjectShare, MemberRole } from '@/types/collaboration'

export async function listWorkspaces(): Promise<Workspace[]> {
  const { data } = await apiClient.get<{ workspaces: Workspace[] }>('/api/workspaces')
  return data.workspaces
}

export async function createWorkspace(name: string, description?: string): Promise<Workspace> {
  const { data } = await apiClient.post<{ workspace: Workspace }>('/api/workspaces', { name, description })
  return data.workspace
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data } = await apiClient.get<{ members: WorkspaceMember[] }>(`/api/workspaces/${workspaceId}/members`)
  return data.members
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: Exclude<MemberRole, 'owner'>
): Promise<WorkspaceMember> {
  const { data } = await apiClient.post<{ member: WorkspaceMember }>(
    `/api/workspaces/${workspaceId}/members`,
    { email, role }
  )
  return data.member
}

export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
}

export async function shareProject(
  projectId: string,
  workspaceId: string,
  permissions: ('read' | 'write')[],
  linkSharingEnabled: boolean
): Promise<ProjectShare> {
  const { data } = await apiClient.post<{ share: ProjectShare }>(
    `/api/workspaces/projects/${projectId}/share`,
    { workspaceId, permissions, linkSharingEnabled }
  )
  return data.share
}

export async function getProjectShare(
  projectId: string
): Promise<{ share: ProjectShare | null; members: WorkspaceMember[] }> {
  const { data } = await apiClient.get<{ share: ProjectShare | null; members: WorkspaceMember[] }>(
    `/api/workspaces/projects/${projectId}/share`
  )
  return data
}
