import { error } from 'console';
import { Request, Response, NextFunction } from 'express';
import { checkSchema, ParamSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { bioSchema, confirmPasswordSchema, dateOfBirthSchema, emailSchema, imageSchema, locationSchema, nameSchema, passwordSchema, usernameSchema, userSchema, websiteSchema } from '~/@types/type.schema';
import { UserVerifyStatus } from '~/constants/enum';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/message';
import { REGEX_USERNAME } from '~/constants/regex';
import { verifyAccessToken } from '~/middlewares/common.middleware';
import { ErrorWithStatus } from '~/models/Errors';
import { TokenPayload } from '~/models/requests/User.requests';
import databaseService from '~/services/database.services';
import { envConfig } from '~/utils/config';
import { hashPassword } from '~/utils/crypto';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';
export const loginValidator = validate(checkSchema({
  email: emailSchema,
  password: passwordSchema
}, ['body']))

export const registerValidator = validate(checkSchema({
  name: nameSchema,
  email: {
    trim: true,
    isEmail: {
      errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
    },
    custom: {
      options: async (value, { req }) => {
        const user = await databaseService.users.findOne({ email: value })
        if (user) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.UNAUTHORIZED,
            message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS
          })
        }
        return true
      }
    }
  },
  password: passwordSchema,
  confirm_password: confirmPasswordSchema,
  date_of_birth: dateOfBirthSchema
}, ['body']))

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            return verifyAccessToken(access_token, req as Request)
          }
        }
      }
    }, ['headers']))

export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.REFRESH_TOKEN_MUST_A_STRING
      },
      custom: {
        options: async (value, { req }) => {
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, secretOnPublicKey: envConfig.JWT_REFRESH_TOKEN_SECRET }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            if (refresh_token === null) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXITS, status: HTTP_STATUS.UNAUTHORIZED })
            }
            req.decoded_refresh_token = decoded_refresh_token
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.REFRESH_TOKEN_INVALID, status: HTTP_STATUS.UNAUTHORIZED })
            }
            throw error
          }
        }
      }
    }
  }, ['body']))

export const emailVerifyTokenValidator = validate(
  checkSchema({
    email_verify_token: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value, { req }) => {
          const decoded_email_verify_token = await verifyToken({ token: value, secretOnPublicKey: envConfig.JWT_EMAIL_VERIFY_TOKEN_SECRET })
          req.decoded_email_verify_token = decoded_email_verify_token
        }
      }
    }
  }, ['body']))

export const forgotPasswordvalidator = validate(
  checkSchema({
    email: {
      trim: true,
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({ email: value })
          if (!user) {
            throw Error(USERS_MESSAGES.USER_NOT_FOUND)
          }
          req.user = user
          return true
        }
      }
    },
  }, ['body'])
)

export const verifyForgotPasswordTokenValidator = validate(checkSchema({
  forgot_password_token: {
    trim: true,
    notEmpty: {
      errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
    },
    custom: {
      options: async (value, { req }) => {
        try {
          const decoded_forgot_password_token = await verifyToken({
            token: value,
            secretOnPublicKey: envConfig.JWT_SECRET_FORGOT_TOKEN as string,
          })

          const { user_id } = decoded_forgot_password_token
          const user = await databaseService.users.findOne({
            _id: new ObjectId(user_id)
          })
          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          if (user.forgot_password_token !== value) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }
        } catch (error) {
          if (error instanceof JsonWebTokenError) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
              , status: HTTP_STATUS.UNAUTHORIZED
            })
          }
          throw error
        }
      }
    }
  }
}, ['body']))

export const resetPasswordValidor = validate(
  checkSchema({
    forgot_password_token: {
      trim: true,
      notEmpty: {
        errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value, { req }) => {
          try {
            const decoded_forgot_password_token = await verifyToken({
              token: value,
              secretOnPublicKey: envConfig.JWT_SECRET_FORGOT_TOKEN as string,
            })

            const { user_id } = decoded_forgot_password_token
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            if (user.forgot_password_token !== value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            req.decoded_forgot_password_token = user
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID
                , status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            throw error
          }
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  }, ['body'])
)

export const updateMeValidator = validate(
  checkSchema({
    name: {
      ...nameSchema,
      optional: true,
      notEmpty: undefined
    },
    date_of_birth: {
      ...dateOfBirthSchema,
      optional: true,
      notEmpty: undefined
    },
    bio: bioSchema,
    location: locationSchema,
    website: websiteSchema,
    username: {
      optional: true,
      isString: {
        errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 1,
          max: 50
        },
        errorMessage: USERS_MESSAGES.USERNAME_LENGTH
      },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!REGEX_USERNAME.test(value)) {
            throw Error(
              USERS_MESSAGES.USERNAME_INVALID
            )
          }
          const user = await databaseService.users.findOne({
            username: value
          })

          if (user) {
            throw Error(USERS_MESSAGES.USERNAME_ALREADY_EXISTS)
          }

        }
      }
    },
    avatar: imageSchema,
    cover_photo: imageSchema
  }, ['body'])
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  console.log("🚀 ~ verifiedUserValidator ~ verify:", verify)
  if (verify !== UserVerifyStatus.Verified) {
    return next(new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    }))
  }
  next()
}

export const followValidator = validate(checkSchema({
  followed_user_id: userSchema
}, ['body']))

export const unfollowValidator = validate(checkSchema({
  user_id: userSchema
}, ['params']))

export const changePasswordValidator = validate(checkSchema({
  old_password: {
    isString: {
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1 // ký tự đặc biệt
      },
      errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
    },
    custom: {
      options: async (value, { req }) => {
        const { user_id } = req.decoded_authorization as TokenPayload
        const user = await databaseService.users.findOne(new ObjectId(user_id))
        if (!user) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.NOTFOUND
          })
        }
        if (hashPassword(value) !== user.password) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.PASSWORD_OLD_NOT_MATCH,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
      }
    }
  },
  new_password: passwordSchema,
  confirm_new_password: {
    notEmpty: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
    },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_EQUAL_TO_PASSWORD)
        }
        return true
      }
    }
  }
}, ['body']))


export const isUserLoginValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.header('Authorization')) {
      return middleware(req, res, next)
    }
    next()
  }
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOTFOUND
        })
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOTFOUND
        })
      }
    }
  }
}

export const getConversationValidator = validate(checkSchema({
  receiver_id: userIdSchema,
}))                                             