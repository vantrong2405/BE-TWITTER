import HTTP_STATUS from "~/constants/httpStatus"
import { USERS_MESSAGES } from "~/constants/message"

type ErrorsType = Record<string, {
  msg: string
  [key: string]: any
}>

export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string, status: number }) {
    this.message = message;
    this.status = status;
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, status, errors }: { message?: string, status?: number, errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}