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
import cors from 'cors'
import conversationRouter from '~/routes/conversation.router';
import initSocket from '~/utils/socket';
import helmet from 'helmet';
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
app.use(express.json());
app.use(limiter)
app.use('/users', userRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRoutes)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR)) 
app.use('/tweet', TweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/searchs', searchRouter)
app.use('/conversations', conversationRouter)
initSocket(httpsServer)
// default error handler
app.use(defaultErrorHandler)
httpsServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
