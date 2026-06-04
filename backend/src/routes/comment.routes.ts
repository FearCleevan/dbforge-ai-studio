import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  listComments,
  createComment,
  addReply,
  toggleResolve,
  deleteComment,
  getCommentCounts,
} from '../controllers/comment.controller'

const router = Router()

router.use(requireAuth)

router.get('/project/:projectId',               listComments)
router.post('/project/:projectId',              createComment)
router.get('/project/:projectId/counts',        getCommentCounts)
router.post('/:commentId/reply',               addReply)
router.patch('/:commentId/resolve',            toggleResolve)
router.delete('/:commentId',                   deleteComment)

export default router
