import express from 'express';
import userRouter from './routes/users.router';
import databaseService from './services/database.services';
import { defaultErrorHandler } from '~/middlewares/error.middleware';
import mediasRouter from '~/routes/medias.router';
import { UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';
import staticRoutes from '~/routes/statics.router';
import { initFolder } from '~/utils/file';
import TweetRouter from '~/routes/tweets.router';
import bookmarkRouter from '~/routes/bookmarks.router';
import likeRouter from '~/routes/likes.router';
import searchRouter from '~/routes/searchs.router';
import { createServer } from "http";
import cors, { CorsOptions } from 'cors'
import conversationRouter from '~/routes/conversation.router';
import initSocket from '~/utils/socket';
import { envConfig, isProduction } from '~/utils/config';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit'
import { corsOptions, limiter, port } from '~/utils/utils';
// import '~/utils/faker'

initFolder([UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR])

databaseService.connect()
  .then(() => {
    databaseService.indexeUser()
    databaseService.indexRefreshToken()
    databaseService.indexFollowers()
    databaseService.indexVideoStatus()
    databaseService.indexFollowers()
    databaseService.indexTweet()
  })
const app = express();
const httpsServer = createServer(app);
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());// convert json -> data
// Apply the rate limiting middleware to all requests.
app.use(limiter)
app.use('/users', userRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRoutes)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR)) // tự động phục vụ cho các tệp chứa trong UPLOAD_VIDEO_DIR. nếu name video có trong folder này
app.use('/tweet', TweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/searchs', searchRouter)
app.use('/conversations', conversationRouter)
// default error handler
initSocket(httpsServer)
app.use(defaultErrorHandler)
httpsServer.listen(port, () => {
  console.log(process.env.PORT, '>>>')
  console.log(`Server is running at http://localhost:${port}`);
});

// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.hmuyl.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`;
// const mgclient = new MongoClient(uri)
// const db = mgclient.db('earth')
// const users = db.collection('users')
// const usersData = []

// for (let i = 0; i < 1000; i++) {
//   usersData.push({
//     name: 'user' + (i + 1),
//     age: Math.floor(Math.random() * 100) + 1,
//     sex: i % 2 ? 'Male' : 'Female'
//   })
// }

// users.insertMany(usersData) => create data in mongodb