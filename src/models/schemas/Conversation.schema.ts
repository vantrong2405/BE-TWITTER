import { ObjectId } from 'mongodb'
interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  updated_at?: Date
}
export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  updated_at: Date
  constructor(Conversation: ConversationType) {
    this._id = Conversation._id
    this.sender_id = Conversation.sender_id
    this.receiver_id = Conversation.receiver_id
    this.content = Conversation.content
    this.created_at = Conversation.created_at || new Date()
    this.updated_at = Conversation.updated_at || new Date()
  }
}