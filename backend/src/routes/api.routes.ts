import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { proxyRequest } from '../controllers/api.controller'

const router = Router()

router.use(requireAuth)
router.post('/send', proxyRequest)

export default router
