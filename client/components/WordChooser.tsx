import React, { useContext, useEffect, useState } from 'react';
import { MouseEventHandler } from 'react';
import { get } from './WebSocket';
import { GameContext } from '../pages/_app';
import { Message } from '../models/Message';
import { MessageType } from '../models/MessageType';
import { Player } from '../models/Player';

const ws = get();

export default function WoodChooser() {
    const [words, setWords] = useState([]);
    const gameContext = useContext(GameContext);
    const player: Player = gameContext.gameState.players.find((player: any) => player.isYou);
    const drawer: Player = gameContext.gameState.players.find((player: any) => player.isDrawing);

    const eventHandler = (event: MessageEvent<any>) => {
        const msg: Message = JSON.parse(event.data);
        switch (msg.type) {
            case MessageType.SetWordChoices:
                setWords(JSON.parse(msg.data!));
                break;
            case MessageType.SetWord:
                gameContext.updateGameState({ word: msg.data });
                break;
        }
    }

    useEffect(() => {
        setWords([]);
        ws.addEventListener('message', eventHandler);
        if (player.isDrawing) {
            ws.send(JSON.stringify({
                type: MessageType.GetWordChoices
            }));
        }
        return () => ws.removeEventListener('message', eventHandler);
    }, [player.isDrawing]);

    const chooseWord: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const word = (e.currentTarget.value);
        ws.send(JSON.stringify({
            type: MessageType.ChooseWord,
            data: word
        }));
        gameContext.updateGameState({ word: word });

    }

    const wordButtons = words.map((word, index) => (
        <button className={`bg-gray-200 hover:bg-gray-100 p-2 ${index !== words.length - 1 ? 'mr-2': ''}`} key={word} value={word} onClick={chooseWord}>{word}</button>
    ));

    return (
        <div className='absolute top-0 right-0 bottom-0 left-0 bg-gray-100 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='border-1 border-gray-300 border-opacity-25 shadow-lg'>
                {player.isDrawing &&
                    <>
                        <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Choose a word</div>         
                        <div className='flex justify-around bg-white p-2'>
                            {wordButtons.length > 0 &&
                                wordButtons
                            }
                            {wordButtons.length === 0 &&
                                <div 
                                    className='border-4 border-b-blue-500 rounded-full w-8 h-8' 
                                    style={{
                                        animation: 'spin 1s linear infinite'
                                    }}
                                />
                            }
                        </div>
                       
                    </>
                }
                {!player.isDrawing && drawer &&
                    <>
                        <div className='flex justify-around bg-white p-2'>
                            {`${drawer.name} is choosing the word`}
                        </div>
                    </>
                }
            </div>
        </div>
    )
}
