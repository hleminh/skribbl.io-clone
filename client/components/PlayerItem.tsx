import React, { useEffect, useState } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';
import ChatMessageBubble from './ChatMessageBubble';
import { get } from './WebSocket';

const ws = get();

export default function PlayerItem(props: {player: any}) {
    const [message, setMessage] = useState('');
    const player = props.player;

    console.log('player item render');

    useEffect(() => {
        ws!.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.directive === 'chat' && msg.senderId === player.id) {
                setMessage(msg.data);
            }
        })
    }, []);

    return (
        <div className='relative'>
            <div  className='flex items-center justify-center mb-2 select-none'>
                {player.isHost && <RiVipCrownFill className='inline-block mr-2 ' />}{!player.isHost && <BsFillPersonFill className='inline-block mr-2 ' />}{player.name} {player.isYou ? '(You)' : ''}
            </div>
            <ChatMessageBubble withFadeOut>{message}</ChatMessageBubble>
        </div>
    )
}
