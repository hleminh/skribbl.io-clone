import React, { useContext, useEffect, useState } from 'react';
import { MouseEventHandler } from 'react';
import { get } from './WebSocket';
import { GameContext } from '../pages/_app';

const ws = get();

export default function WoodChooser() {
    const [words, setWords] = useState([]);
    const gameContext = useContext(GameContext);
    const player = gameContext.gameState.players.find((player: any) => player.isYou);
    const host = gameContext.gameState.players.find((player: any) => player.isHost);

    useEffect(() => {
        ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.directive) {
                case 'getWords':
                    setWords(JSON.parse(msg.data));
                    break;
                case 'setWord':
                    gameContext.updateGameState({ word: msg.data })
            }
        });
        ws.send(JSON.stringify({
            directive: 'getWords'
        }));
    }, []);

    const chooseWord: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const word = (e.currentTarget.value);
        ws.send(JSON.stringify({
            directive: 'setWord',
            data: word
        }));
        gameContext.updateGameState({ word: word })

    }

    const wordButtons = words.map((word) => (
        <button className='bg-gray-200 hover:bg-gray-100 p-2 mr-2' key={word} value={word} onClick={chooseWord}>{word}</button>
    ));

    return (
        <div className='absolute top-0 right-0 bottom-0 left-0 bg-gray-100 flex items-center justify-center'>
            <div
                className='bg-white border border-black rounded'
            >
                {player.isHost &&
                    <>
                        <div className='text-center p-2 border-b border-black select-none'>Choose a word</div>
                        <div className='flex justify-around p-2'>
                            {wordButtons}
                        </div>
                    </>
                }
                {!player.isHost &&
                    <>
                        <div className='flex justify-around p-2'>
                            {`${host.name} is choosing word`}
                        </div>
                    </>
                }
            </div>
        </div>
    )
}
