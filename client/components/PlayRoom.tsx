import React from 'react';
import Timer from '../components/Timer';
import Painter from '../components/Painter';
import Chat from '../components/Chat';

export default function PlayRoom() {

    return (
        <div className='flex'>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Timer time={60} width={800} />
                <Painter height={500} width={800} />
            </div>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Chat height={500}></Chat>
            </div>
        </div>
    )
}
