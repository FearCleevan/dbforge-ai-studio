import { Router } from 'express'
import { generate, optimize, translate, execute } from '../controllers/query.controller'
import { requireAuth } from '../middleware/auth'
import { aiLimiter } from '../middleware/rateLimiter'

const router = Router()

router.use(requireAuth)

router.post('/generate',  aiLimiter, generate)
router.post('/optimize',  aiLimiter, optimize)
router.post('/translate', aiLimiter, translate)
router.post('/execute',   execute)

export default router
