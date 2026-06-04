import { Router } from 'express'
import { generate, validate } from '../controllers/schema.controller'
import { requireAuth } from '../middleware/auth'
import { aiLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(requireAuth)

router.post('/generate', aiLimiter, generate)
router.post('/validate', aiLimiter, validate)

export default router
