import { Project, ProjectMeta, AppSettings } from '@/types'

const STORAGE_KEY = 'dbforge_projects'
const SETTINGS_KEY = 'dbforge_settings'

const defaultSettings: AppSettings = {
  theme: 'dark',
  defaultTarget: 'postgresql',
  autoSave: true,
}

export const localStorageService = {
  getProjects(): Project[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Project[]) : []
    } catch {
      return []
    }
  },

  saveProject(project: Project): void {
    const projects = this.getProjects()
    const idx = projects.findIndex(p => p.id === project.id)
    const updated = { ...project, updatedAt: new Date().toISOString() }
    if (idx >= 0) {
      projects[idx] = updated
    } else {
      projects.push(updated)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  },

  deleteProject(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  },

  getProject(id: string): Project | null {
    const project = this.getProjects().find(p => p.id === id) ?? null
    if (!project) return null
    // Migrate old entries that predate new fields
    if (!project.savedSchemas) project.savedSchemas = []
    return project
  },

  getProjectsMeta(): ProjectMeta[] {
    return this.getProjects().map(p => ({ id: p.id, name: p.name, updatedAt: p.updatedAt }))
  },

  exportProject(project: Project): void {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.dbforge.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importProject(json: string): Project | null {
    try {
      const project = JSON.parse(json) as Project
      if (!project.id || !project.name) return null
      project.updatedAt = new Date().toISOString()
      this.saveProject(project)
      return project
    } catch {
      return null
    }
  },

  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) } : defaultSettings
    } catch {
      return defaultSettings
    }
  },

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SETTINGS_KEY)
  },
}
