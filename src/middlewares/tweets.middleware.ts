import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweets.schema'
import databaseService from '~/services/database.services'
import { wrapRequestHandler } from '~/utils/handlers'
import { numberEnumToArray } from '~/utils/other'
import { validate } from '~/utils/validation'
const tweetType = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetType],
        errorMessage: TWEET_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudience],
        errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          // Nếu type là retweet, comment, quotetweet thì parent_id phải là tweet_id của tweet cha
          if ([TweetType.ReTweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    content: {
      isString: {
        errorMessage: TWEET_MESSAGES.CONTENT_MUST_BE_A_STRING
      },
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mention = req.body.mentions as string[]
          // Nếu type là comment, quotetwet, tweet và không có mention và hashtags thì content phải là string không được rỗng
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mention) &&
            value === ''
          ) {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          if (type === TweetType.ReTweet && value !== '') {
            throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: {
        errorMessage: TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là string
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_STRING_ARRAY)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: {
        errorMessage: TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là user_id
          if (!value.every((item: any) => ObjectId.isValid(item))) {
            throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_USER_ID_ARRAY)
          }
          return true
        }
      }
    },
    medias: {
      isArray: {
        errorMessage: TWEET_MESSAGES.MEDIA_MUST_BE_AN_ARRAY
      },
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần tử trong array là Media
          if (
            value.every((item: any) => {
              return typeof item.url !== 'string' || !mediaType.includes(item.type)
            })
          ) {
            throw new Error(TWEET_MESSAGES.MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const tweetIDValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_ID
        }, custom: {
          options: async (value, { req }) => {
            const [tweet] = await databaseService.tweet.aggregate<Tweet>(
              [
                {
                  '$match': {
                    '_id': new ObjectId(value)
                  }
                }, {
                  '$lookup': {
                    'from': 'hashtags',
                    'localField': 'hashtags',
                    'foreignField': '_id',
                    'as': 'hashtags'
                  }
                }, {
                  '$lookup': {
                    'from': 'users',
                    'localField': 'mentions',
                    'foreignField': '_id',
                    'as': 'mentions'
                  }
                }, {
                  '$addFields': {
                    'mentions': {
                      '$map': {
                        'input': '$mentions',
                        'as': 'mention',
                        'in': {
                          '_id': '$$mention._id',
                          'name': '$$mention.name',
                          'username': '$$mention.username',
                          'email': '$$mention.email'
                        }
                      }
                    }
                  }
                }, {
                  '$lookup': {
                    'from': 'bookmarks',
                    'localField': '_id',
                    'foreignField': 'tweet_id',
                    'as': 'bookmarks'
                  }
                }, {
                  '$lookup': {
                    'from': 'likes',
                    'localField': '_id',
                    'foreignField': 'tweet_id',
                    'as': 'likes'
                  }
                }, {
                  '$lookup': {
                    'from': 'tweets',
                    'localField': '_id',
                    'foreignField': 'parent_id',
                    'as': 'tweet_children'
                  }
                }, {
                  '$addFields': {
                    'bookmarks': {
                      '$size': '$bookmarks'
                    },
                    'likes': {
                      '$size': '$likes'
                    },
                    'retweet_count': {
                      '$size': {
                        '$filter': {
                          'input': '$tweet_children',
                          'as': 'item',
                          'cond': {
                            '$eq': [
                              '$$item.type', 1
                            ]
                          }
                        }
                      }
                    },
                    'commment_count': {
                      '$size': {
                        '$filter': {
                          'input': '$tweet_children',
                          'as': 'item',
                          'cond': {
                            '$eq': [
                              '$$item.type', 2
                            ]
                          }
                        }
                      }
                    },
                    'quote_count': {
                      '$size': {
                        '$filter': {
                          'input': '$tweet_children',
                          'as': 'item',
                          'cond': {
                            '$eq': [
                              '$$item.type', 3
                            ]
                          }
                        }
                      }
                    },
                    'views': {
                      '$add': [
                        '$user_views', '$guest_views'
                      ]
                    }
                  }
                }, {
                  '$project': {
                    'tweet_children': 0
                  }
                }
              ]).toArray()
            if (!tweet) {
              throw new ErrorWithStatus({ status: HTTP_STATUS.NOTFOUND, message: TWEET_MESSAGES.TWEET_NOT_FOUND })
            }
            req.tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)


export const audienceValidator = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { tweet } = req
    console.log("🚀 ~ audienceValidator ~ tweet:", tweet)
    if (tweet?.audience === TweetAudience.TweetCircle) {
      // Kiểm tra xem có đăng nhập chưa?
      if (!req.decoded_authorization) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_IN_INVAILD
        })
      }

      // Kiểm tra tài khoản có bị khóa hay tồn tại ko 
      const author = await databaseService.users.findOne({
        _id: new ObjectId(tweet.user_id),
      })

      if (!author || author.verify === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOTFOUND,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
      // kiểm tra tweet này có trong TweetCircle của tác giả đó không
      const { user_id } = req.decoded_authorization // id tác giá ( đang đăng nhập)
      const isInTwitteCircle = author.twitter_circles.some((user_id_circle) => user_id_circle.equals(user_id))
      console.log(">>>>", !isInTwitteCircle, " and ", !author._id.equals(user_id)); // true và false

      if (!isInTwitteCircle && !author._id.equals(user_id)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.FORBIDDEN,
          message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC
        })
      }
    }
    next()
  }
)

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: {
        options: [TweetType],
        errorMessage: TWEET_MESSAGES.INVALID_TYPE
      }
    }
  }, ['query'])
)


export const paginationValidator = validate(
  checkSchema({
    limit: {
      isNumeric: true,
      custom: {
        options: (value, { req }) => {
          const num = Number(value)
          if (num > 100 && num < 0) {
            throw new Error(' 1<= limit <=100 ')
          }
          return true
        }
      }
    },
    page: {
      isNumeric: true,
      custom: {
        options: (value, { req }) => {
          const num = Number(value)
          if (num < 1) {
            throw new Error('Page >= 1')
          }
          return true
        }
      }
    }
  }, ['query'])
)