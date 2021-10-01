import React, { useContext, useEffect, useRef } from 'react';
import Timer from '../components/Timer';
import Painter from '../components/Painter';
import Chat from '../components/Chat';
import PlayersList from './PlayersList';
import GameInfo from './GameInfo';

import { GameContext } from '../pages/_app';

export default function PlayRoom() {

    const gameContext = useContext(GameContext);

    const gameStateRef = useRef<any>(null);

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    return (
        <div
            className='grid gap-2 min-h-0 max-h-full'
            style={{
                gridTemplateRows: `max-content max-content 0`
            }}
        >
            <div>
                <Timer time={gameContext.gameState.drawTime} />
            </div>
            <div>
                <GameInfo />
            </div>
            <div
                className='grid gap-2 min-h-0 max-h-full'
                style={{
                    gridTemplateColumns: `max-content minmax(400px, 1fr) minmax(400px, 1fr)`
                }}
            >
                <PlayersList maxHeight={500} />
                <Painter />
                <Chat />
            </div>
        </div>
    )
}
