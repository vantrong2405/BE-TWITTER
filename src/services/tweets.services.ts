import { ITweetChildrenRequest, TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Tweet from '~/models/schemas/Tweets.schema'
import { TweetType } from '~/constants/enum'
import { ppid } from 'process'
class TweetService {
  async checkAndCreateHashtags(hashtags: string[]) { // câu lệnh query nếu tìm ra thì trả về , ko tìm ra thì create và trả về
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtag.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' } // returnDocument: 'after' : trả về sau khi update data
        )
      })
    )
    return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
  }

  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const result = await databaseService.tweet.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        mentions: body.mentions,
        hashtags,
        medias: body.medias,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const user = await databaseService.tweet.findOne({
      _id: result.insertedId
    })
    return user
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweet.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: { guest_views: 1, user_views: 1, updated_at: 1 }
      }
    )
    return result as {
      guest_views: number,
      user_views: number,
      updated_at: Date
    }
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: ITweetChildrenRequest) {
    const tweets = await databaseService.tweet.aggregate<Tweet>(
      [
        {
          '$match': {
            'parent_id': new ObjectId(tweet_id),
            'type': tweet_type
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
                      '$$item.type', TweetType.ReTweet
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
                      '$$item.type', TweetType.Comment
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
                      '$$item.type', TweetType.QuoteTweet
                    ]
                  }
                }
              }
            }
          }
        }, {
          '$project': {
            'tweet_children': 0
          }
        },
        // Bạn có tổng cộng 100 tài liệu.
        // Bạn muốn hiển thị 10 tài liệu mỗi trang.
        // Hiện tại bạn đang ở trang 3.
        // Tính toán
        // $skip:

        // Tài liệu cần bỏ qua = limit * (page - 1) = 10 * (3 - 1) = 20.
        // MongoDB sẽ bỏ qua 20 tài liệu đầu tiên trong kết quả.
        // $limit:

        // MongoDB sẽ lấy 10 tài liệu tiếp theo (sau khi bỏ qua 20 tài liệu đầu tiên).
        // $limit:  MongoDB sẽ lấy 10 tài liệu tiếp theo (sau khi bỏ qua 20 tài liệu đầu tiên).
        {
          '$skip': limit * (page - 1)
        },
        {
          '$limit': limit
        }
      ]
    ).toArray()
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [, total] = await Promise.all([
      databaseService.tweet.updateMany({
        _id: {
          $in: ids
        }
      }, {
        $inc: inc,
        $set: {
          updated_at: date
        }
      }),
      databaseService.tweet.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views = (tweet.user_views || 0) + 1
      } else {
        tweet.guest_views = (tweet.guest_views || 0) + 1
      }
    })
    return {
      tweets, total
    }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const followed_user_ids = await databaseService.followers
      .find(
        {
          user_id: new ObjectId(user_id)
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(new ObjectId(user_id))
    const [tweets, total] = await Promise.all([
      databaseService.tweet
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    username: '$$mention.username',
                    email: '$$mention.email'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_child'
            }
          },
          {
            $addFields: {
              bookmarks: {
                $size: '$bookmarks'
              },
              likes: {
                $size: '$likes'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.ReTweet]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.Comment]
                    }
                  }
                }
              },
              quote_count: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweet
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    const tweetIds = tweets.map((item) => item._id as ObjectId)
    const date = new Date()
    databaseService.tweet.updateMany(
      {
        _id: {
          $in: tweetIds
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    tweets.forEach((item) => {
      item.updated_at = date
      item.user_views += 1
    })
    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
}
const tweetServices = new TweetService()
export default tweetServices