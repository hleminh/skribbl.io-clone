import React, { ChangeEventHandler, ReactNode, useContext, useEffect, useRef } from 'react';
import { MouseEventHandler } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';
import { get } from '../components/WebSocket';
import { GameContext } from '../pages/_app';

const ws = get();

export default function WaitRoom() {
    const roomURLRef = useRef<HTMLDivElement>(null);

    const gameContext = useContext(GameContext);

    const gameStateRef = React.useRef<any>();

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    useEffect(() => {
        ws!.addEventListener('message', (event) => {
            console.log(event.data);
            const data = event.data.split(',');
            switch (data[0]) {
                case 'setStage': {
                    gameContext.updateGameState({
                        stage: data[1]
                    });
                    break;
                }
                case 'playerJoin': {
                    console.log(gameStateRef.current);
                    gameContext.updateGameState({
                        players: gameStateRef.current.players.concat([data[1]])
                    });
                    break;
                }
                case 'playerLeave': {
                    gameContext.updateGameState({
                        players: gameStateRef.current.players.filter((el: any) => el !== data[1])
                    });
                    break;
                }
                case 'setDrawTime': {
                    gameContext.updateGameState({
                        drawTime: data[1]
                    });
                    break;
                }
                case 'setRounds': {
                    gameContext.updateGameState({
                        rounds: data[1]
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
        ws.send(`setStage,play`);
    }

    const setRounds: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            rounds: e.target.value,
        });
        ws.send(`setRounds,${e.target.value}`);
    }

    const setDrawTime: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            drawTimes: e.target.value,
        });
        ws.send(`setDrawTime,${e.target.value}`);
    }

    const copyURL: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log(roomURLRef.current!.innerHTML);
    }

    const rounds = Array.from({ length: 9 }, (x, i) => i + 2).map((number) => <option value={number} key={number}>{number}</option>);
    const drawTimes = Array.from({ length: 16 }, (x, i) => 30 + i * 10).map((number) => <option value={number} key={number}>{number}</option>);

    const playerItems = gameContext.gameState.players.map((player: any) => (
        <div key={player.name} className='flex items-center justify-center mb-2 select-none'>
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
                            <select name='rounds' id='rounds' className='block w-full mb-2 border border-black rounded' value={gameContext.gameState.rounds} onChange={setRounds}>
                                {rounds}
                            </select>
                            <label htmlFor='drawTime' className='select-none'>Draw time in seconds</label>
                            <select name='drawTime' id='drawTime' className='block block w-full mb-2 border border-black rounded' value={gameContext.gameState.drawTime} onChange={setDrawTime}>
                                {drawTimes}
                            </select>
                            <button onClick={startGame} className='bg-gray-200 hover:bg-gray-100 block block w-full p-2 rounded'>Start Game</button>
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
                        <div className='border border-black mr-2 p-2 rounded flex-auto' ref={roomURLRef}>{`localhost:3000/${gameContext.gameState.roomURL}`}</div>
                        <button onClick={copyURL} className='bg-gray-200 hover:bg-gray-100 block block p-2 rounded flex-none'>Copy</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
