import React, { useContext } from 'react';
import Timer from '../components/Timer';
import Painter from '../components/Painter';
import Chat from '../components/Chat';
import PlayersList from './PlayersList';
import { GameContext } from '../pages/_app';

export default function PlayRoom() {

    const gameContext = useContext(GameContext);

    return (
        <div className='flex'>
            <div className='flex flex-col flex-auto items-center m-4'>
                <PlayersList />
            </div>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Timer time={60} width={800} />
                <div className='border border-black select-none text-center mb-2' style={{
                    width: 800
                }}>
                    {gameContext.gameState.word === '' ? <>&nbsp;</> : gameContext.gameState.word}
                </div>
                <Painter height={500} width={800} />
            </div>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Chat height={500}></Chat>
            </div>
        </div>
    )
}
