import { ObjectId } from 'mongodb'
import databaseService from './database.services'
class ConversationService {
  getConversation = async ({
    sender_id,
    receiver_id,
    limit,
    page
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) => {
    const match = {
      $or: [
        {
          sender_id: new ObjectId(sender_id),
          receiver_id: new ObjectId(receiver_id)
        },
        {
          sender_id: new ObjectId(receiver_id),
          receiver_id: new ObjectId(sender_id)
        }
      ]
    }
    const result = await databaseService.conversation
      .find(match).sort({ created_at: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray()
    const total = await databaseService.conversation.countDocuments(match)
    return {
      message: 'Get conversation successfully',
      data: result,
      total: Math.ceil(total / limit),
      limit,
      page
    }
  }
}
const conversationService = new ConversationService()
export default conversationService