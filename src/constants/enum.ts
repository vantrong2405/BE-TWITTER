export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum EncodingStatus {
  Pending,
  Processing,
  Success,
  Failed
}

export enum TweetType {
  Tweet,
  ReTweet,
  Comment,
  QuoteTweet
}

export enum MediaQuery {
  Image = 'image',
  Video = 'video'
}

export enum PeopleFollow {
  Anyone = '0',
  Following = '1'
}

export enum TweetAudience {
  Everyone,
  TweetCircle
}