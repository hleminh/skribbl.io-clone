import React, { useContext, useEffect, useRef } from 'react';
import Timer from '../components/Timer';
import Painter from '../components/Painter';
import Chat from '../components/Chat';
import PlayersList from './PlayersList';
import GameInfo from './GameInfo';

import { GameContext } from '../pages/_app';
import { get } from './WebSocket';
import { MessageType } from '../models/MessageType';
import { Player } from '../models/Player';

const ws = get();

export default function PlayRoom() {

    const gameContext = useContext(GameContext);

    const gameStateRef = useRef<any>(null);

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    return (
        <div
            className='grid gap-2'
            style={{
                gridTemplateRows: `max-content max-content max-content`
            }}
        >
            <div>
                <Timer time={gameContext.gameState.drawTime} />
            </div>
            <div>
                <GameInfo />
            </div>
            <div
                className='grid gap-2'
                style={{
                    gridTemplateColumns: `minmax(0, max-content) max-content minmax(0, 1fr)`
                }}
            >
                <PlayersList maxHeight={500}/>
                <Painter height={500} width={800} />
                <Chat height={500} />
            </div>
        </div>
    )
}
