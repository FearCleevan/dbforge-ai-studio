import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listVersions,
  getVersion,
  downloadMigrationSQL,
  revertToVersion,
} from '../controllers/version.controller'

const router = Router()

router.use(requireAuth)

router.get('/project/:projectId',                     listVersions)
router.get('/project/:projectId/:version',            getVersion)
router.get('/project/:projectId/:version/sql',        downloadMigrationSQL)
router.post('/project/:projectId/:version/revert',    revertToVersion)

export default router
