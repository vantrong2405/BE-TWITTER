import { NextFunction, Request, Response, RequestHandler } from "express";
import { ParamsDictionary } from 'express-serve-static-core'

export const wrapRequestHandler = <T>(func: any) => {
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}