import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { TweetRequestBody } from '~/models/requests/Tweet.request'
import databaseService from '~/services/database.services'
import { hashPassword } from './crypto'
import { random } from 'lodash'
import tweetServices from '~/services/tweets.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import Follower from '~/models/schemas/Follower.schema'
const PASSWORD = 'vanwtrong@@'
const MYID = new ObjectId('675ab047acf7179673a7496d')
const USER_COUNT = 50
const createRandomUser = () => {
  const user: RegisterReqBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  }
  return user
}
const user: RegisterReqBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})
const insertMultipleUsers = async (users: RegisterReqBody[]) => {
  const result = Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: user.email.split('@')[0] + random(1000, 9999),
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified,
          _id: user_id
        })
      )
      return user_id
    })
  )
  return result
}
const followMultipleUsers = async (user_id: ObjectId, follow_user_ids: ObjectId[]) => {
  console.log('Follow multiple users')
  const result = await Promise.all(
    follow_user_ids.map((follow_user_id) => {
      databaseService.followers.insertOne(
        new Follower({
          user_id,
          followed_user_id: new ObjectId(follow_user_id)
        })
      )
    })
  )
  console.log('Follow multiple users successfully')
}
const createRandomTweet = (user_id: ObjectId) => {
  console.log(user_id.toString())
  const tweet: TweetRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: [],
    medias: [],
    mentions: [],
    parent_id: null,
    user_id
  }
  return tweet
}
const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Create multiple tweets')
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([tweetServices.createTweet(createRandomTweet(id), id.toString())])
      await Promise.all([tweetServices.createTweet(createRandomTweet(id), id.toString())])
    })
  )
  console.log('Create multiple tweets successfully')
  return result
}
insertMultipleUsers(user).then((ids) => {
  // console.log('ids', ids)
  // insertMultipleTweets(ids)
  followMultipleUsers(new ObjectId(MYID), ids)
  console.log('Faker Done')
  // createRandomTweet(new ObjectId(MYID))
})