import { apiClient } from './client'
import { localStorageService } from '@/lib/storage/localStorageService'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', { email, password, name })
  return data
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', { email, password })
  return data
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/api/auth/me')
  return data
}

export function saveAuthLocally(token: string, user: AuthUser): void {
  // Clear any project data from a previously logged-in user before saving new credentials
  const previousUser = getStoredUser()
  if (previousUser && previousUser.id !== user.id) {
    localStorageService.clearAll()
  }
  localStorage.setItem('dbforge_token', token)
  localStorage.setItem('dbforge_user', JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem('dbforge_token')
  localStorage.removeItem('dbforge_user')
  // Clear project cache so the next user starts with a clean slate
  localStorageService.clearAll()
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('dbforge_user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('dbforge_token')
}
