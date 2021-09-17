import React, { useContext, useRef } from 'react';
import { MouseEventHandler } from 'react';
import { init } from '../components/WebSocket';
import { Message } from '../models/Message';
import { GameContext } from '../pages/_app';

export default function JoinRoom({roomId}: {[key: string]: any}) {
    const nameInputRef = useRef<HTMLInputElement>(null);

    const gameContext = useContext(GameContext);

    const joinRoom: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {

        const playerName = nameInputRef.current!.value;

        init(gameContext, roomId, playerName).then((event) => {
            const msg: Message = JSON.parse(event.data);
            gameContext.updateGameState(JSON.parse(msg.data!));
        });
    }

    return (
        <div className='absolute top-1 right-1 bottom-1 left-1 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='border-2 border-gray-200 border-opacity-25 shadow-lg'>
                <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Join Room</div>
                <div className='bg-white p-2'>
                    <label htmlFor='name' className='select-none'>Player Name</label>
                    <input name='name' id='name' className='border border-black w-full mb-2 p-2' ref={nameInputRef}></input>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2 w-full' onClick={joinRoom}>Join</button>
                </div>
            </div>
        </div>
    )
}
