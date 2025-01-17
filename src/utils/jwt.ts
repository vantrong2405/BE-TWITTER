import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

export const signToken = ({ payload, privateKey = process.env.JWT_SECRET as string, options = {
  algorithm: 'HS256'
} }: {
  payload: string | Buffer | object,
  privateKey: string,
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error);
      }
      return resolve(token as string);
    })
  })
}

export const verifyToken = ({
  token,
  secretOnPublicKey = process.env.JWT_ACCESS_TOKEN_SECRET as string
}: {
  token: string
  secretOnPublicKey?: string
}) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOnPublicKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded as TokenPayload)
    })
  })
}