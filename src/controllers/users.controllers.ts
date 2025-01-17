import { NextFunction, Request, Response } from "express";
import { followersReqBody, LoginReqBody, LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, TokenPayload, unfollowersReqBody, UpdateMeReqBody } from "~/models/requests/User.requests";
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from "mongodb";
import User from "~/models/schemas/User.schema";
import { USERS_MESSAGES } from "~/constants/message";
import databaseService from "~/services/database.services";
import HTTP_STATUS from "~/constants/httpStatus";
import userService from "~/services/users.services";
import { UserVerifyStatus } from "~/constants/enum";
import { readingEmailTemplate, sendMail } from "~/utils/email";
import path from "path";
import { TEMPLATE_EMAIL } from "~/constants/dir";

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userService.login({ user_id: user_id.toString(), verify: user.verify })
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
}

export const oauthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await userService.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response, next: NextFunction) => {
  const result = await userService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userService.logout(refresh_token)
  return res.json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS,
    result
  })
}
export const refreshTolenController = async (req: Request<ParamsDictionary, any, RefreshTokenReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const result = await userService.refreshToken({ refresh_token, verify, user_id, exp })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const emailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (!user) {
    res.status(HTTP_STATUS.NOTFOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user?.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const result = await userService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const deleteDBController = async (req: Request, res: Response) => {
  try {
    await Promise.all([
      // databaseService.users.deleteMany({}),
      databaseService.refreshTokens.deleteMany({}),
      databaseService.bookmark.deleteMany({}),
      databaseService.conversation.deleteMany({}),
      databaseService.hashtag.deleteMany({}),
      databaseService.videoStatus.deleteMany({}),
      databaseService.like.deleteMany({}),
      databaseService.followers.deleteMany({}),
      databaseService.tweet.deleteMany({}),
    ]);

    return res.json({
      message: USERS_MESSAGES.DELETE_DB_SUCCESS
    });

  } catch (error) {
    console.error('Error deleting database:', error)
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const resenVerifyEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    res.status(HTTP_STATUS.NOTFOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
    return
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFY_BEFORE
    })
    return
  }

  const result = await userService.resendVerifyEmail(user_id, user)
  return res.json(result)
}

export const forgetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { _id, verify, email, name } = req.user as User
  const result = await userService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, name, email })
  // send mail
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetpasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { _id } = req.decoded_forgot_password_token as User
  const { password } = req.body
  const result = await userService.resetPassword((_id as ObjectId).toString(), password)
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const result = await userService.getMe(user_id)

  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const { body } = req
  const user = await userService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
}
export const followController = async (req: Request<ParamsDictionary, any, followersReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const { followed_user_id } = req.body
  const result = await userService.follower(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowController = async (req: Request<unfollowersReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const { user_id: followed_user_id } = req.params
  const result = await userService.unfollower(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization
  const { new_password } = req.body
  const result = await userService.changePassword(user_id, new_password)
  return res.json(result)
}

export const getUser = async (req: Request<ParamsDictionary>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const result = await userService.getUser(username)
  return res.json(result)
}
