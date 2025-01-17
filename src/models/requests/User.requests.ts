import { JwtPayload } from "jsonwebtoken"
import { TokenType, UserVerifyStatus } from "~/constants/enum"
import { ParamsDictionary } from 'express-serve-static-core'
export interface RegisterReqBody {
  email: string
  name: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface UpdateMeReqBody {
  name: string
  date_of_birth: string
  bio: string
  location: string
  website: string
  username: string
  avatar: string
  cover_photo: string
}

export interface followersReqBody {
  followed_user_id: string
}

export interface GetProfileReqParams extends ParamsDictionary {
  username: string
}
export interface unfollowersReqBody extends ParamsDictionary {
  user_id: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}
export interface LogoutReqBody {
  refresh_token: string
}
export interface ForgotPasswordReqBody {
  refresh_token: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export type UpdateMeReqBodyPartial = Partial<UpdateMeReqBody>

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}