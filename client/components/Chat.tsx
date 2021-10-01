import React, { FormEventHandler, KeyboardEventHandler, useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../pages/_app';
import ChatMessage from './ChatMessage';
import { get } from './WebSocket';
import { MessageType } from '../models/MessageType';
import { ChatMessage as ChatMessageI } from '../models/ChatMessage';
import { Player } from '../models/Player';
import { ChatMessageType } from '../models/ChatMessageType';

const ws = get();

export default function Chat() {
    const gameContext = useContext(GameContext);

    const messagesList = gameContext.gameState.chatMessages.map((msg: ChatMessageI, index: number) => <ChatMessage index={index} key={index} message={msg} />)

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const messagesListRef = useRef<HTMLDivElement>(null);

    const player: Player = gameContext.gameState.players.find((player: any) => player.isYou);

    const sendMessage: FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newMessage = textAreaRef.current!.value;
        if (textAreaRef.current!.value) {
            gameContext.updateGameState({
                chatMessages: gameContext.gameState.chatMessages.concat([
                    {
                        senderId: player.id,
                        senderName: player.name + ' (You)',
                        content: newMessage,
                        type: player.isGuessed || player.isDrawing ? ChatMessageType.GuessedChat : ChatMessageType.Chat
                    }
                ])
            });
            ws!.send(JSON.stringify({
                type: MessageType.Chat,
                data: newMessage
            }));
            textAreaRef.current!.value = '';
            textAreaRef.current!.focus();
        }
    }

    const submitHandler: FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMessage(e);
    }

    const keyPressHandler: KeyboardEventHandler = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            sendMessage(e);
        }
    }

    console.log('chat render');

    useEffect(() => {
        window.addEventListener('resize', (event) => {
            messagesListRef.current!.scrollTop = messagesListRef.current!.scrollHeight;
        })
    }, []);

    useEffect(() => {
        messagesListRef.current!.scrollTop = messagesListRef.current!.scrollHeight;
    }, [gameContext.gameState.chatMessages]);

    return (
        <div className='border-gray-300 border-2 border-opacity-25 flex box-content shadow-lg min-h-0'>
            <div className='flex flex-col bg-white p-2 flex-auto min-w-0'>
                <div className='flex flex-col overflow-y-auto mb-2 pb-4 flex-1' ref={messagesListRef}>
                    {messagesList}
                </div>
                <form className='flex flex-none min-w-0' onSubmit={submitHandler}>
                    <textarea ref={textAreaRef} onKeyPress={keyPressHandler} placeholder='Type your guess here...' className='border border-black p-2 resize-none flex-auto' rows={2} />
                    <button className='bg-gray-200 min-w-0 overflow-hidden overflow-ellipsis hover:bg-gray-100 p-2 font-medium' type='submit'>Send</button>
                </form>
            </div>
        </div>
    )
}
