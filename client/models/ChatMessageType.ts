import {MessageType} from './MessageType'

export enum ChatMessageType {
    Notify = MessageType.Notify,
    Alert = MessageType.Alert,
    Info = MessageType.Info,
    Chat = MessageType.Chat,
    GuessedChat = MessageType.GuessedChat
}
