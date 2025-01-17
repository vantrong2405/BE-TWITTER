import { NextFunction, Response, Request } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { TweetType } from "~/constants/enum"
import { TWEET_MESSAGES } from "~/constants/message"
import { ITweetChildrenRequest, Pagination, TweetParam, TweetQuery } from "~/models/requests/Tweet.request"
import Tweet from "~/models/schemas/Tweets.schema"
import tweetServices from "~/services/tweets.services"

export const createTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const result = await tweetServices.createTweet(req.body, user_id)
  return res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESS,
    result
  })
}
export const getTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await tweetServices.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_view: result.guest_views,
    user_view: result.user_views,
    views: result.guest_views + result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCCESS,
    result: tweet
  })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response, next: NextFunction) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const tweet_type = Number(req.query.tweet_type)
  const user_id = req.decoded_authorization?.user_id
  const { total, tweets } = await tweetServices.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })
  return res.json({
    message: TWEET_MESSAGES.GET_TWEET_CHILDREN_SUCCESS,
    result: {
      tweets,
      total,
      tweet_type,
      limit,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const getNewfeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response, next: NextFunction) => {
  const user_id = req.decoded_authorization.user_id
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await tweetServices.getNewFeeds({
    user_id,
    limit,
    page
  })
  return res.json({
    message: TWEET_MESSAGES.GET_NEWFEEDS_SUCCESS,
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}