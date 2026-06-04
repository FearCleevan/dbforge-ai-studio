import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listWorkspaces,
  createWorkspace,
  getWorkspaceMembers,
  inviteMember,
  removeMember,
  shareProject,
  getProjectShare,
} from '../controllers/workspace.controller'

const router = Router()

router.use(requireAuth)

router.get('/',                              listWorkspaces)
router.post('/',                             createWorkspace)
router.get('/:workspaceId/members',          getWorkspaceMembers)
router.post('/:workspaceId/members',         inviteMember)
router.delete('/:workspaceId/members/:memberId', removeMember)

// Project sharing routes — nested under projects
router.post('/projects/:projectId/share',    shareProject)
router.get('/projects/:projectId/share',     getProjectShare)

export default router
