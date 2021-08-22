import React, { ChangeEventHandler, useContext, useEffect, useRef, useState } from 'react';
import { MouseEventHandler } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';
import { get } from '../components/WebSocket';
import { GameContext } from '../pages/_app';

const ws = get();

const placeHolderText = 'Hover over me to see the invite link!';

export default function WaitRoom() {
    const [roomURL, setRoomURL] = useState(placeHolderText);

    const gameContext = useContext(GameContext);

    const gameStateRef = React.useRef<any>();

    const isNotHost = !gameContext.gameState.players.find((player: any) => player.isYou).isHost;

    const url = `${window.location.origin}/${gameContext.gameState.roomID}`

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    useEffect(() => {
        ws!.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            switch (msg.directive) {
                case 'setStage': {
                    gameContext.updateGameState({
                        stage: msg.data
                    });
                    break;
                }
                case 'playerJoin': {
                    const player = JSON.parse(msg.data);
                    gameContext.updateGameState({
                        players: gameStateRef.current.players.concat([player])
                    });
                    break;
                }
                case 'playerLeave': {
                    const playerId = parseInt(JSON.parse(msg.data));
                    gameContext.updateGameState({
                        players: gameStateRef.current.players.filter((el: any) => el.id !== playerId)
                    });
                    break;
                }
                case 'setDrawTime': {
                    const time = parseInt(JSON.parse(msg.data));
                    gameContext.updateGameState({
                        drawTime: time
                    });
                    break;
                }
                case 'setRounds': {
                    const numberOfRounds = parseInt(JSON.parse(msg.data));
                    gameContext.updateGameState({
                        rounds: numberOfRounds
                    });
                    break;
                }
            }
        });
        return () => console.log('WaitRoom useEffect cleanup');
    }, [])

    const startGame: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        gameContext.updateGameState({
            stage: 'play'
        });
        ws.send(JSON.stringify({
            directive: 'setStage',
            data: 'play'
        }));
    }

    const setRounds: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            rounds: e.target.value,
        });
        ws.send(JSON.stringify({
            directive: 'setRounds',
            data: e.target.value
        }));
    }

    const setDrawTime: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            drawTime: e.target.value,
        });
        ws.send(JSON.stringify({
            directive: 'setDrawTime',
            data: e.target.value
        }));    
    }

    const copyURL: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        navigator.clipboard.writeText(url);
    }

    const showURL: MouseEventHandler = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        setRoomURL(url);
    }

    const hideURL: MouseEventHandler = (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        setRoomURL(placeHolderText);
    }

    const rounds = Array.from({ length: 9 }, (x, i) => i + 2).map((number) => <option value={number} key={number}>{number}</option>);
    const drawTimes = Array.from({ length: 16 }, (x, i) => 30 + i * 10).map((number) => <option value={number} key={number}>{number}</option>);

    const playerItems = gameContext.gameState.players.map((player: any) => (
        <div key={player.id} className='flex items-center justify-center mb-2 select-none'>
            {player.isHost && <RiVipCrownFill className='inline-block mr-2 ' />}{!player.isHost && <BsFillPersonFill className='inline-block mr-2 ' />}{player.name} {player.isYou ? '(You)' : ''}
        </div>
    ));

    return (
        <div className='absolute top-1 right-1 bottom-1 left-1 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='flex flex-col'>
                <div className='flex mb-4'>
                    <div className='bg-white border border-black rounded mr-4'>
                        <div className='text-center p-2 border-b border-black select-none'>Settings</div>
                        <div className='p-2'>
                            <label htmlFor='rounds' className='select-none'>Rounds</label>
                            <select name='rounds' disabled={isNotHost} id='rounds' className='block w-full mb-2 border border-black rounded disabled:opacity-50' value={gameContext.gameState.rounds} onChange={setRounds}>
                                {rounds}
                            </select>
                            <label htmlFor='drawTime' className='select-none'>Draw time in seconds</label>
                            <select name='drawTime' disabled={isNotHost} id='drawTime' className='block block w-full mb-2 border border-black rounded disabled:opacity-50' value={gameContext.gameState.drawTime} onChange={setDrawTime}>
                                {drawTimes}
                            </select>
                            <button disabled={isNotHost} className='bg-gray-200 hover:bg-gray-100 block w-full p-2 rounded disabled:opacity-50' onClick={startGame}>Start Game</button>
                        </div>
                    </div>
                    <div className='bg-white border border-black rounded'>
                        <div className='text-center p-2 border-b border-black select-none'>Players</div>
                        <div className='flex flex-col items-start p-2'>
                            {playerItems}
                        </div>
                    </div>
                </div>
                <div className='bg-white border border-black rounded'>
                    <div className='text-center p-2 border-b border-black select-none'>Invite your friends!</div>
                    <div className='flex p-2'>
                        <textarea readOnly rows={1} className='border border-black mr-2 p-2 rounded flex-auto resize-none text-center' value={roomURL} onMouseEnter={showURL} onMouseLeave={hideURL}></textarea>
                        <button className='bg-gray-200 hover:bg-gray-100 block block p-2 rounded flex-none' onClick={copyURL}>Copy</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
