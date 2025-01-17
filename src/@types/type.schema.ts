import { ParamSchema } from "express-validator";
import { ObjectId } from "mongodb";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import { ErrorWithStatus } from "~/models/Errors";
import databaseService from "~/services/database.services";
import { hashPassword } from "~/utils/crypto";


export const passwordSchema: ParamSchema = {
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
  }
}

export const confirmPasswordSchema: ParamSchema = {
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
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_EQUAL_TO_PASSWORD)
      }
      return true
    }
  }
}

export const emailSchema: ParamSchema = {
  trim: true,
  isEmail: {
    errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
  },
  custom: {
    options: async (value, { req }) => {
      const user = await databaseService.users.findOne({ email: value, password: hashPassword(req.body.password) })
      if (!user) {

        throw new ErrorWithStatus({
          status: HTTP_STATUS.UNAUTHORIZED,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
      req.user = user
      return true
    }
  }
}

export const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}

export const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_IO8601
  }
}

export const bioSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.BIO_LENGTH
  },
}

export const locationSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.LOCATION_LENGTH
  },
}

export const websiteSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
  },
}

export const usernameSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 50
    },
    errorMessage: USERS_MESSAGES.USERNAME_LENGTH
  },
}
export const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMG_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMG_LENGTH
  },
}

export const userSchema: ParamSchema = {
  custom: {
    options: async (value, { req }) => {
      if (!ObjectId.isValid(value)) { // dư ký tự thì lụm ko phải kiểu objectId
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.NOTFOUND
        })
      }
      const followed_user = await databaseService.users.findOne({ _id: new ObjectId(value) })
      if (followed_user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOTFOUND
        })
      }
    }
  }
}