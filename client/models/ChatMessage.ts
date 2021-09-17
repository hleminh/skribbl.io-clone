import { ChatMessageType } from "./ChatMessageType";

export interface ChatMessage {
    senderId?: number,
    senderName?: string,
    type: ChatMessageType
    content: string
}
