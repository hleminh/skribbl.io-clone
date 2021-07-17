import React, { FormEventHandler, useEffect, useRef, useState } from 'react';
import Message from './Message';
import { ws } from './WebSocket';

export default function Chat(props: { height: number }) {

    const [messages, setMessages] = useState<string[]>([]);

    const messagesList = messages.map((msg, index) => <Message key={index}>{msg}</Message>)

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const messagesListRef = useRef<HTMLDivElement>(null);

    const sendMessage: FormEventHandler = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newMessage = textAreaRef.current!.value;
        if (textAreaRef.current!.value) {
            setMessages(messages => [
                ...messages,
                newMessage
            ]);
            ws!.send(`chat,${newMessage}`);
            textAreaRef.current!.value = '';
        }
    }

    useEffect(() => {
        ws!.addEventListener('message', (event) => {
            const data = event.data.split(',');

            if (data[0] === 'chat') {
                setMessages(messages => [
                    ...messages,
                    data[1]
                ]);
            }
        });
    }, [])

    useEffect(() => {
        messagesListRef.current!.scrollTop = messagesListRef.current!.scrollHeight;
    }, [messages])

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
