import React, { useContext } from 'react';
import { GameContext } from '../pages/_app';
import PlayerItem from './PlayerItem';

export default function PlayersList() {
    const gameContext = useContext(GameContext);

    const playerItems = gameContext.gameState.players.map((player: any) => (
        <PlayerItem key={player.id} player={player}/>
    ));

    return (
        <div className='bg-white border border-black rounded'>
            <div className='text-center p-2 border-b border-black select-none'>Players</div>
            <div className='flex flex-col items-start p-2'>
                {playerItems}
            </div>
        </div>
    )
}
