import { SchemaDefinition, NamingConvention } from './schema'
import { QueryDefinition } from './query'
import { APIRequest, APIEnvironment } from './api'

export interface SavedSchema {
  id:      string
  name:    string
  schema:  SchemaDefinition
  savedAt: string
}

export interface Project {
  id:               string
  name:             string
  description?:     string
  schema?:          SchemaDefinition
  savedSchemas:     SavedSchema[]
  queries:          QueryDefinition[]
  apiRequests:      APIRequest[]
  environments:     APIEnvironment[]
  namingConvention: NamingConvention
  createdAt:        string
  updatedAt:        string
}

export interface ProjectMeta {
  id:        string
  name:      string
  updatedAt: string
}

export interface AppSettings {
  theme:        'dark'
  defaultTarget: string
  autoSave:     boolean
}
