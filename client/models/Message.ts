import { MessageType } from './MessageType'

export interface Message {
    senderId?: number
    type: MessageType,
    data?: string
}
