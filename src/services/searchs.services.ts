import { MediaQuery, MediaType, TweetType } from '~/constants/enum'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
class SearchService {
  async search({ limit, page, content, user_id, media_type, people_follow }: { limit: number, page: number, content: string, user_id: string, media_type?: MediaQuery, people_follow?: string }) {
    const $match: any = {
      $text: {
        $search: content
      }
    }
    if (media_type) {
      if (media_type === MediaQuery.Image) {
        $match['medias.type'] = MediaType.Image
      } else if (media_type === MediaQuery.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.HLS]
        }
      }
    }

    if (people_follow && people_follow === '1') {
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
      $match['user_id'] = {
        $in: ids
      }
    }

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
    // Có danh sách các id người dùng đã kb 
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    ids.push(new ObjectId(user_id))
    const [tweets, total] = await Promise.all([
      databaseService.tweet.aggregate(
        [
          {
            $match
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'user_id',
              'foreignField': '_id',
              'as': 'user'
            }
          }, {
            '$match': {
              '$or': [
                {
                  'audience': 0
                }, {
                  '$and': [
                    {
                      'audience': 1
                    }, {
                      'user.twitter_circle': {
                        '$in': [
                          new ObjectId(user_id)
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          }, {
            '$unwind': {
              'path': '$user'
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
              },
              'views': {
                '$add': [
                  '$user_views', '$guest_views'
                ]
              }
            }
          }, {
            '$project': {
              'tweet_children': 0,
              'user': {
                'password': 0,
                'email_verify_token': 0,
                'forgot_password_token': 0,
                'twitter_circles': 0,
                'date_of_birth': 0
              }
            }
          }, {
            '$skip': limit * (page - 1)
          }, {
            '$limit': limit
          }
        ]
      ).toArray(),
      databaseService.tweet
        .aggregate([
          {
            $match
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
const searchService = new SearchService()
export default searchService