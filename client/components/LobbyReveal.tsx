import React, { useEffect, useState } from 'react';
import { Message } from '../models/Message';
import { MessageType } from '../models/MessageType';
import { get } from './WebSocket';
import { Summary } from '../models/Summary'
import { PlayerScore } from '../models/PlayerScore';
import { sortByGameScore } from '../common/Utils';

const ws = get();


export default function LobbyReveal() {
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
        }
    }

    useEffect(() => {
        ws.addEventListener('message', eventListener)
        ws.send(JSON.stringify({
            type: MessageType.GetSummary
        }));
        return () => ws.removeEventListener('message', eventListener)
    }, []);

    console.log(summary);

    const playerScores = summary.scores.sort(sortByGameScore).map((score: PlayerScore, index: number) =>
        <>
            <div className='font-medium text-left'>#{index + 1}</div>
            <div className='font-medium text-left'>{score.name}{score.isYou ? ' (You)' : ''}</div>
            <div className='text-green-500 font-medium text-left'>{score.gameScore}</div>
        </>
    )

    return (
        <div className='absolute top-0 right-0 bottom-0 left-0 bg-gray-100 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='flex flex-col border-1 border-gray-300 border-opacity-25 shadow-lg'>
                <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Game Ended</div>
                <div className='text-center flex-col bg-white select-none p-2 pb-0 '>Result</div>
                <div 
                    className='text-center grid grid-auto-cols gap-2 bg-white select-none p-2' 
                    style={{
                        gridTemplateColumns: 'max-content max-content max-content'
                    }}
                >
                    {playerScores}
                </div>
            </div>
        </div>
    )
}
