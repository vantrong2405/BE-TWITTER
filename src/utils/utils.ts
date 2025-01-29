import { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import { envConfig, isProduction } from "~/utils/config";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 1000, 
  standardHeaders: 'draft-8', 
  legacyHeaders: false,
})

export const port = envConfig.PORT
export const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.CLIENT_URL : '*',
}