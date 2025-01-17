import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import { LikeRequestBody } from '~/models/requests/Like.request'
import likeService from '~/services/likes.services'
import { LIKE_MESSAGES } from '~/constants/message'

export const likeTweetController = async (req: Request<ParamsDictionary, any, LikeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likeService.likeTweetService(user_id, req.body.tweet_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESS,
    result
  })
}

export const unlikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likeService.unlikeTweetService(user_id, req.params.tweet_id)
  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESS,
    result
  })
}
