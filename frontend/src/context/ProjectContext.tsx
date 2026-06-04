import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { Project, ProjectMeta, SchemaDefinition, QueryDefinition, APIRequest, SavedSchema } from '@/types'
import { localStorageService } from '@/lib/storage/localStorageService'
import { isAuthenticated } from '@/lib/api/auth'
import {
  fetchProjects,
  fetchProject,
  createProjectRemote,
  updateProjectRemote,
} from '@/lib/api/projects'

type ProjectAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'CREATE_PROJECT'; payload: Project }
  | { type: 'UPDATE_SCHEMA'; payload: SchemaDefinition }
  | { type: 'SAVE_SCHEMA'; payload: SavedSchema }
  | { type: 'DELETE_SAVED_SCHEMA'; payload: string }
  | { type: 'ADD_QUERY'; payload: QueryDefinition }
  | { type: 'DELETE_QUERY'; payload: string }
  | { type: 'ADD_API_REQUEST'; payload: APIRequest }
  | { type: 'DELETE_API_REQUEST'; payload: string }
  | { type: 'SET_PROJECTS_LIST'; payload: ProjectMeta[] }

interface ProjectState {
  currentProject: Project | null
  projectsList:   ProjectMeta[]
}

interface ProjectContextValue extends ProjectState {
  dispatch:           React.Dispatch<ProjectAction>
  createProject:      (project: Project) => Promise<void>
  switchProject:      (id: string) => Promise<void>
  saveCurrentProject: () => Promise<void>
}

const initialState: ProjectState = {
  currentProject: null,
  projectsList:   [],
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'CREATE_PROJECT':
      return {
        ...state,
        currentProject: action.payload,
        projectsList: [
          ...state.projectsList,
          { id: action.payload.id, name: action.payload.name, updatedAt: action.payload.updatedAt },
        ],
      }
    case 'SET_PROJECT':
      return { ...state, currentProject: action.payload }
    case 'UPDATE_SCHEMA':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          schema: action.payload,
          updatedAt: new Date().toISOString(),
        },
      }
    case 'SAVE_SCHEMA':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          savedSchemas: [action.payload, ...(state.currentProject.savedSchemas ?? [])],
          updatedAt: new Date().toISOString(),
        },
      }
    case 'DELETE_SAVED_SCHEMA':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          savedSchemas: (state.currentProject.savedSchemas ?? []).filter(s => s.id !== action.payload),
          updatedAt: new Date().toISOString(),
        },
      }
    case 'ADD_QUERY':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          queries: [...state.currentProject.queries, action.payload],
          updatedAt: new Date().toISOString(),
        },
      }
    case 'DELETE_QUERY':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          queries: state.currentProject.queries.filter(q => q.id !== action.payload),
          updatedAt: new Date().toISOString(),
        },
      }
    case 'ADD_API_REQUEST':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          apiRequests: [...state.currentProject.apiRequests, action.payload],
          updatedAt: new Date().toISOString(),
        },
      }
    case 'DELETE_API_REQUEST':
      if (!state.currentProject) return state
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          apiRequests: state.currentProject.apiRequests.filter(r => r.id !== action.payload),
          updatedAt: new Date().toISOString(),
        },
      }
    case 'SET_PROJECTS_LIST':
      return { ...state, projectsList: action.payload }
    default:
      return state
  }
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

function migrateProject(p: Project): Project {
  return {
    ...p,
    savedSchemas: p.savedSchemas ?? [],
    queries:      p.queries      ?? [],
    apiRequests:  p.apiRequests  ?? [],
    environments: p.environments ?? [],
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)
  const remoteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load projects list on mount
  useEffect(() => {
    if (isAuthenticated()) {
      fetchProjects()
        .then(list => dispatch({ type: 'SET_PROJECTS_LIST', payload: list }))
        .catch(() => {
          const meta = localStorageService.getProjectsMeta()
          dispatch({ type: 'SET_PROJECTS_LIST', payload: meta })
        })
    } else {
      const meta = localStorageService.getProjectsMeta()
      dispatch({ type: 'SET_PROJECTS_LIST', payload: meta })
    }
  }, [])

  // ── Critical: persist to localStorage on EVERY project change ──────────────
  // This is what makes data survive a refresh. Backend sync is secondary.
  useEffect(() => {
    if (!state.currentProject) return
    const project = state.currentProject

    // Always write to localStorage immediately — this is the source of truth on reload
    localStorageService.saveProject(project)

    // Backend sync: debounced, authenticated users only
    if (!isAuthenticated()) return

    if (remoteDebounce.current) clearTimeout(remoteDebounce.current)
    remoteDebounce.current = setTimeout(() => {
      updateProjectRemote(project.id, project).catch(() => {
        // localStorage already saved — no data loss
      })
    }, 1000)
  }, [state.currentProject])

  const createProject = useCallback(async (project: Project) => {
    const migrated = migrateProject(project)
    localStorageService.saveProject(migrated)
    dispatch({ type: 'CREATE_PROJECT', payload: migrated })

    if (isAuthenticated()) {
      try {
        await createProjectRemote(migrated)
      } catch {
        // localStorage already saved — continue offline
      }
    }
  }, [])

  const switchProject = useCallback(async (id: string) => {
    // Try backend first when authenticated
    if (isAuthenticated() && id !== 'demo-project-ecommerce') {
      try {
        const project = await fetchProject(id)
        const migrated = migrateProject(project)
        localStorageService.saveProject(migrated)
        dispatch({ type: 'SET_PROJECT', payload: migrated })
        return
      } catch {
        // Fall through to localStorage
      }
    }

    const project = localStorageService.getProject(id)
    if (project) dispatch({ type: 'SET_PROJECT', payload: migrateProject(project) })
  }, [])

  const saveCurrentProject = useCallback(async () => {
    if (!state.currentProject) return
    localStorageService.saveProject(state.currentProject)

    if (isAuthenticated()) {
      try {
        await updateProjectRemote(state.currentProject.id, state.currentProject)
      } catch {
        // localStorage saved — continue offline
      }
    }
  }, [state.currentProject])

  return (
    <ProjectContext.Provider value={{ ...state, dispatch, createProject, switchProject, saveCurrentProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider')
  return ctx
}
