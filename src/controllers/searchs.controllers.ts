import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response, NextFunction } from 'express'
import { SearchQuery } from '~/models/requests/Search.request'
import searchService from '~/services/searchs.services'
import { SEARCH_MESSAGES } from '~/constants/message'
export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization.user_id
  const result = await searchService.search({
    limit,
    page,
    content: req.query.content as string,
    user_id,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow
  })
  return res.json({
    message: SEARCH_MESSAGES.SUCCESS,
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}