import { Router } from 'express'
import { searchController } from '~/controllers/searchs.controllers'
import { searchValidator } from '~/middlewares/searchs.middleware'
import { paginationValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRouter = Router()

searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchValidator,
  wrapRequestHandler(searchController)
)
export default searchRouter