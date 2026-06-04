import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listConnections,
  createConnection,
  deleteConnection,
  testConnectionEndpoint,
  reverseEngineerEndpoint,
} from '../controllers/connection.controller'

const router = Router()

router.use(requireAuth)

router.get('/',             listConnections)
router.post('/',            createConnection)
router.delete('/:id',       deleteConnection)
router.post('/test',        testConnectionEndpoint)
router.post('/:id/reverse', reverseEngineerEndpoint)

export default router
