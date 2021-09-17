import React from 'react';
import { ChatMessage as IChatMessage} from '../models/ChatMessage';
import { ChatMessageType } from '../models/ChatMessageType';

export default function ChatMessage(props: { index: number, message: IChatMessage }) {
    const msg = props.message;
    let fontColor: string = '';
    let fontStyle: string = '';
    let formattedMsg: React.ReactNode;

    switch (msg.type) {
        case ChatMessageType.Alert:
            fontColor = 'text-red-500';
            fontStyle = 'font-medium';
            formattedMsg = <span>{msg.content}</span>;
            break;
        case ChatMessageType.Notify:
            fontColor = 'text-green-500';
            fontStyle = 'font-medium';
            formattedMsg = <span>{msg.content}</span>;
            break;
        case ChatMessageType.Info:
            fontColor = 'text-blue-500';
            fontStyle = 'font-medium';
            formattedMsg = <span>{msg.content}</span>;
            break;
        case ChatMessageType.Chat:
            formattedMsg = <span><span className='font-medium'>{msg.senderName}:</span> {msg.content}</span>;
            break;
        case ChatMessageType.GuessedChat:
            fontColor = 'text-yellow-500';
            formattedMsg = <span><span className='font-medium'>{msg.senderName}:</span> {msg.content}</span>;
            break;
    }

    return (
        <div className={`${props.index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'} mb-2 p-2 break-words ${fontColor} ${fontStyle}`}>
            {formattedMsg}
        </div>
    )
}
