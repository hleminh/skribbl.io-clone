import React, { FormEventHandler, useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../pages/_app';
import ChatMessage from './ChatMessage';
import { get } from './WebSocket';

const ws = get();

export default function Chat(props: { height: number }) {

    const [messages, setMessages] = useState<string[]>([]);

    const messagesList = messages.map((msg, index) => <ChatMessage key={index}>{msg}</ChatMessage>)

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const messagesListRef = useRef<HTMLDivElement>(null);

    const gameContext = useContext(GameContext);

    const gameStateRef = useRef<any>();

    const player = gameContext.gameState.players.find((player: any) => player.isYou);

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    const sendMessage: FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newMessage = textAreaRef.current!.value;
        if (textAreaRef.current!.value) {
            setMessages(messages => [
                ...messages,
                `${player.name} (You): ${newMessage}`
            ]);
            ws!.send(JSON.stringify({
                directive: 'chat',
                data: newMessage
            }));
            textAreaRef.current!.value = '';
        }
    }

    console.log('chat render');

    useEffect(() => {
        console.log('chat useEffect');

        ws!.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);

            switch(msg.directive) {
                case 'chat':
                    const sender = gameStateRef.current.players.find((player: any) => player.id === msg.senderId);
                    const senderName = `${sender.name}${sender.isYou ? ' (You)' : ''}`;
                    setMessages((messages: any) => [
                        ...messages,
                        `${senderName}: ${msg.data}`
                    ]);
                    break;
            }
        });
    }, []);

    useEffect(() => {
        messagesListRef.current!.scrollTop = messagesListRef.current!.scrollHeight;
    }, [messages]);

    return (
        <div
            className='bg-gray-100 border border-black flex flex-col flex-auto rounded p-2'
            style={{
                height: props.height
            }}
        >
            <div className='flex flex-col flex-auto overflow-y-auto mb-2 pb-4' ref={messagesListRef}>
                {messagesList}
            </div>
            <form className='flex flex-none' onSubmit={sendMessage}>
                <textarea ref={textAreaRef} placeholder='Type your answer here' className='border rounded p-2 flex-none resize-none' rows={2} />
                <button className='bg-gray-200 hover:bg-gray-100 p-2 rounded' type='submit'>Send</button>
            </form>
        </div>
    )
}
