import React, { useContext} from 'react';
import { GameContext } from '../pages/_app';
import { RoundState } from '../models/RoundState';

export default function GameInfo() {
    const gameContext = useContext(GameContext);

    return (
        <div className='border-gray-300 border-2 border-opacity-25 select-none box-content font-medium shadow-lg'>
            <div className='bg-white justify-center flex pr-2 pl-2'>
                <span className='mr-auto'>Round {gameContext.gameState.currentRound}/{gameContext.gameState.rounds}</span>
                <span>{gameContext.gameState.roundState !== RoundState.Ongoing ? <>&nbsp;</> : gameContext.gameState.word}</span>
                <span className='ml-auto w-0'></span>
            </div>
        </div>
    )
}
