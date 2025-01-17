import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.services'
import Like from '~/models/schemas/Like.schema'
class LikeService {
  async likeTweetService(user_id: string, tweet_id: string) {
    const result = await databaseService.like.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return (result as WithId<Like>)._id
  }

  async unlikeTweetService(user_id: string, tweet_id: string) {
    const result = await databaseService.like.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result
  }
}
const likeService = new LikeService()
export default likeService