import React, { useContext, useEffect, useState } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { RiVipCrownFill, RiPencilFill } from 'react-icons/ri';
import { Message } from '../models/Message';
import { MessageType } from '../models/MessageType';
import ChatMessageBubble from './ChatMessageBubble';
import { get } from './WebSocket';
import { Player } from '../models/Player';
import { GameContext } from '../pages/_app';

const ws = get();

export default function PlayerItem(props: { player: Player }) {
    const [message, setMessage] = useState<String>('');
    const player = props.player;
    const gameContext = useContext(GameContext);

    console.log('player item render');

    useEffect(() => {
        const msgList = gameContext.gameState.chatMessages;
        const newMsg = msgList[msgList.length - 1];
        if (newMsg && (newMsg.type === MessageType.Chat || newMsg.type === MessageType.GuessedChat) && newMsg.senderId === player.id) {
            setMessage(new String(newMsg.content));
        }
    }, [gameContext.gameState.chatMessages]);

    return (
        <>
            <div className='flex items-center'>
                {player.isDrawing && <RiPencilFill className='inline-block' />}
            </div>
            <div className='flex items-center'>
                {player.isHost && <RiVipCrownFill className='inline-block' />}
                {!player.isHost && <BsFillPersonFill className='inline-block' />}
            </div>
            <div className={`whitespace-nowrap overflow-hidden overflow-ellipsis ${player.isGuessed ? 'text-green-500' : ''}`}>
                <div>{player.name} {player.isYou ? '(You)' : ''}</div>
                <div className='text-sm'>Score: {player.gameScore}</div>
            </div>
            <div className='flex relative w-0'>
                <ChatMessageBubble withFadeOut>{message}</ChatMessageBubble>
            </div>
        </>
    )
}
