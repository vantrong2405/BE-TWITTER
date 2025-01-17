import argv from 'minimist'
import { config } from 'dotenv'

export const options = argv(process.argv.slice(2))
export const isProduction = options.env === 'production'

config({
  path: options.env ? `.env.${options.env}` : '.env',
})


export const envConfig = {
  PORT: process.env.PORT || 4000,
  HOST: process.env.HOST || 'https://my-twitter-clone.com',
  DB_NAME: process.env.DB_NAME || 'twitter',
  DB_USERNAME: process.env.DB_USERNAME || 'doanvvantrong',
  DB_PASSWORD: process.env.DB_PASSWORD || 'sieucap123',
  DB_USERS_COLLECTION: process.env.DB_USERS_COLLECTION || 'users',
  DB_REFRESH_TOKENS_COLLECTION: process.env.DB_REFRESH_TOKENS_COLLECTION || 'refresh_tokens',
  DB_FOLLOWERS_COLLECTION: process.env.DB_FOLLOWERS_COLLECTION || 'followers',
  DB_HASHTAG_COLLECTION: process.env.DB_HASHTAG_COLLECTION || 'hashtags',
  DB_LIKE_COLLECTION: process.env.DB_LIKE_COLLECTION || 'likes',
  DB_BOOKMARK_COLLECTION: process.env.DB_BOOKMARK_COLLECTION || 'bookmarks',
  DB_TWEETS_COLLECTION: process.env.DB_TWEETS_COLLECTiON || 'tweets',
  DB_VIDEO_STATUS_COLLECTION: process.env.DB_VIDEO_STATUS_COLLECTION || 'video_status',
  DB_CONVERSATION_COLLECTION: process.env.DB_CONVERSATION_COLLECTION || 'conversations',
  JWT_EMAIL_VERIFY_TOKEN_SECRET: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRET || '@twitter',
  JWT_SECRET_PASSWORD: process.env.JWT_SECRET_PASSWORD || '@twitter@',
  JWT_SECRET: process.env.JWT_SECRET || 'twitter12344321!@#',
  JWT_SECRET_FORGOT_TOKEN: process.env.JWT_SECRET_FORGOT_TOKEN || 'twitter12344321!@#',
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || 'twitter12344321sadasd',
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || 'twitter12344321sadasd',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '100d',
  EMAIL_VERIFY_TOKEN_EXPIRE_IN: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN || '7d',
  EMAIL_FORGOT_TOKEN_EXPIRE_IN: process.env.EMAIL_FORGOT_TOKEN_EXPIRE_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
  CLIENT_REDIRECT_CALLBACK: process.env.CLIENT_REDIRECT_CALLBACK || '',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '465', 10),
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Dovianorith',
  CLIENT_URL: process.env.CLIENT_URL
};