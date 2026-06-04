import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  runCollection,
  runConnectionQuery,
} from '../controllers/collection.controller'

const router = Router()

router.use(requireAuth)

router.get('/',                     listCollections)
router.post('/',                    createCollection)
router.get('/:id',                  getCollection)
router.put('/:id',                  updateCollection)
router.delete('/:id',               deleteCollection)
router.post('/:id/run',             runCollection)

// DB query via saved connection — for DB-backed assertions
router.post('/connections/:id/query', runConnectionQuery)

export default router
