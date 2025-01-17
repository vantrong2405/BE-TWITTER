import { Server } from "socket.io";
import { ObjectId } from 'mongodb';
import Conversation from '~/models/schemas/Conversation.schema';
import { verifyAccessToken } from '~/middlewares/common.middleware';
import { ErrorWithStatus } from '~/models/Errors';
import { UserVerifyStatus } from '~/constants/enum';
import { TokenPayload } from '~/models/requests/User.requests';
import { USERS_MESSAGES } from '~/constants/message';
import HTTP_STATUS from '~/constants/httpStatus';
import databaseService from "~/services/database.services";
import { Server as ServerHttps } from 'http'
const initSocket = (httpsServer: ServerHttps) => {
  const io = new Server(httpsServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}
  // middleware 
  io.use(async (socket, next) => { // middleware khi connect
    const { Authorization } = socket.handshake.auth //nhận bên client
    const access_token = Authorization?.split(' ')[1]
    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      const { verify } = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      socket.handshake.auth.decoded_authorization = decoded_authorization as TokenPayload // send xuống server
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    socket.use(async (packet, next) => {//midleware khi send message
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })
    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`${socket.id} disconnected`)  // disconnect thì xóa user khỏi list
    })
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect() // nếu có lỗi thì disconnect
      }
    })
    socket.on('send_message', async (data) => {
      const { receiver_id, sender_id, content } = data.payload
      const receive_socket_id = users[receiver_id]?.socket_id // lấy socket id của người nhận ở dòng 96
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      const result = await databaseService.conversation.insertOne(conversation)
      conversation._id = result.insertedId
      socket.to(receive_socket_id).emit('receive_message', {
        payload: conversation
      })
    })
  })
}

export default initSocket