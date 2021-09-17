import React, { useContext } from 'react';
import { GameContext } from '../pages/_app';
import PlayerItem from './PlayerItem';
import { sortByGameScore } from '../common/Utils';

export default function PlayersList(props: { maxHeight: number }) {
    const gameContext = useContext(GameContext);

    const playerItems = gameContext.gameState.players.sort(sortByGameScore).map((player: any) => (
        <PlayerItem key={player.id} player={player} />
    ));

    return (
        <div
            className='flex flex-col flex-none box-content'
            style={{
                maxHeight: props.maxHeight
            }}
        >
            <div className='border-gray-300 border-2 border-opacity-25 shadow-lg'>
                <div className='text-center bg-gray-200 p-2 border-b-2 border-gray-200 flex-none select-none font-medium overflow-hidden overflow-ellipsis'>Players</div>
                <div className='grid auto-rows-auto bg-white gap-2 p-2'
                    style={{
                        gridTemplateColumns: 'minmax(0, max-content) minmax(0, max-content) minmax(0, max-content) minmax(0, max-content)'
                    }}
                >
                    {playerItems}
                </div>
            </div>
        </div>
    )
}
