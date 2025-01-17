import { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import { envConfig, isProduction } from "~/utils/config";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
})

export const port = envConfig.PORT
export const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.CLIENT_URL : '*',
}