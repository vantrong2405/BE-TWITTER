import { Router } from 'express'
import { getConversationController } from '~/controllers/conversation.controllers'
import { paginationValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationRouter = Router()

conversationRouter.get(
  '/receiver/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  wrapRequestHandler(getConversationController)
)
export default conversationRouter