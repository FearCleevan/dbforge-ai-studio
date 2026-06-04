import { Router } from 'express'
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/',      listProjects)
router.get('/:id',   getProject)
router.post('/',     createProject)
router.put('/:id',   updateProject)
router.delete('/:id', deleteProject)

export default router
