import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { pick } from "lodash";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import { ErrorWithStatus } from "~/models/Errors";
import { envConfig } from "~/utils/config";
import { verifyToken } from "~/utils/jwt";
type filterKeys<T> = Array<keyof T>

export const filterMiddleware = <T>(filterKeys: filterKeys<T>) => (req: Request, res: Response, next: NextFunction) => {
  req.body = pick(req.body, filterKeys)
  next()
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOnPublicKey: envConfig.JWT_ACCESS_TOKEN_SECRET
    })
    if (req) {
      req.decoded_authorization = decoded_authorization
      return true
    }
    return decoded_authorization
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_IN_INVAILD,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
    throw error
  }
}