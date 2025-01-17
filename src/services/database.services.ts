
import { Collection, Db, MongoClient } from 'mongodb'
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follower from '~/models/schemas/Follower.schema';
import { VideoStatus } from '~/models/schemas/VideoStatus.schema';
import Tweet from '~/models/schemas/Tweets.schema';
import Hashtag from '~/models/schemas/Hashtag.schema';
import Bookmark from '~/models/schemas/Bookmark.schema';
import Like from '~/models/schemas/Like.schema';
import Conversation from '~/models/schemas/Conversation.schema';
import { envConfig } from '~/utils/config';

const uri = `mongodb+srv://${envConfig.DB_USERNAME}:${envConfig.DB_PASSWORD}@twitter.hmuyl.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(`${envConfig.DB_NAME}`);
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
      console.log(error);
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.DB_FOLLOWERS_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.DB_VIDEO_STATUS_COLLECTION as string)
  }

  get tweet(): Collection<Tweet> {
    return this.db.collection(envConfig.DB_TWEETS_COLLECTION as string)
  }

  get hashtag(): Collection<Hashtag> {
    return this.db.collection(envConfig.DB_HASHTAG_COLLECTION as string)
  }

  get bookmark(): Collection<Bookmark> {
    return this.db.collection(envConfig.DB_BOOKMARK_COLLECTION as string)
  }

  get like(): Collection<Like> {
    return this.db.collection(envConfig.DB_LIKE_COLLECTION as string)
  }

  get conversation(): Collection<Conversation> {
    return this.db.collection(envConfig.DB_CONVERSATION_COLLECTION as string)
  }

  async indexeUser() {
    const exists = await this.users.indexExists(['email_1', 'email_1_password_1'])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 })
    }
  }
  async indexRefreshToken() {
    const exists = await this.refreshTokens.indexExists(['exp_1', 'token_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }
  async indexVideoStatus() {
    const exists = await this.videoStatus.indexExists(['name_1'])
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }
  async indexFollowers() {
    const exists = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }
  async indexTweet() {
    const exists = await this.tweet.indexExists(['content_text'])
    if (!exists) {
      this.tweet.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService