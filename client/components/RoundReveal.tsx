import React, { useContext, useEffect, useState } from 'react';
import { MouseEventHandler } from 'react';
import { Message } from '../models/Message';
import { MessageType } from '../models/MessageType';
import { GameContext } from '../pages/_app';
import { get } from './WebSocket';
import {Summary} from '../models/Summary'
import { PlayerScore } from '../models/PlayerScore';
import { sortByRoundScore } from '../common/Utils';

const ws = get();

export default function RoundReveal() {
    const gameContext = useContext(GameContext);
    const [summary, setSummary] = useState<Summary>({
        word: '',
        reason: '',
        scores: []
    });

    const eventListener = (event: MessageEvent) => {
        const msg: Message = JSON.parse(event.data);
        if (msg.type === MessageType.SetSummary) {
            const data = JSON.parse(msg.data!);
            setSummary(data);
            gameContext.updateGameState({
                word: data.word
            });
        }
    }

    useEffect(() => {
        ws.addEventListener('message', eventListener)
        ws.send(JSON.stringify({
            type: MessageType.GetSummary
        }));
        return () => ws.removeEventListener('message', eventListener)
    }, []);

    const nextRound: MouseEventHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
        ws.send(JSON.stringify({
            type: MessageType.StartNextRound
        }));
    }

    const playerScores = summary.scores.sort(sortByRoundScore).map((score: PlayerScore, index: number) =>
        <div key={index} className='flex justify-between'>
            <span className='font-medium'>{score.name}{score.isYou ? ' (You)' : ''}&nbsp;</span>
            <span className={`${score.roundScore ? 'text-green-500' : 'text-red-500'} font-medium`}>+{score.roundScore}</span>
        </div>
    )

    return (
        <div className='absolute top-0 right-0 bottom-0 left-0 bg-gray-100 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='flex flex-col border-1 border-gray-300 border-opacity-25 shadow-lg'>
                <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Round Ended</div>
                <div className='text-center p-2 pb-0 bg-white select-none'>{`The word was: ${summary.word}`}</div>
                <div className='text-center flex-col bg-white select-none p-2'>
                    {playerScores}
                </div>
                <div className='flex items-center justify-center bg-white p-2'>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2 w-full' onClick={nextRound}>Next Round</button>
                </div>
            </div>
        </div>
    )
}
