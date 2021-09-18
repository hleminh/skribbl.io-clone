import React, { ChangeEventHandler, useContext, useEffect, useRef, useState } from 'react';
import { MouseEventHandler } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { RiVipCrownFill } from 'react-icons/ri';
import { get } from '../components/WebSocket';
import { MessageType } from '../models/MessageType';
import { GameContext } from '../pages/_app';

const ws = get();

const placeHolderText = 'Hover over me to see the invite link!';

export default function WaitRoom() {
    const [roomURL, setRoomURL] = useState(placeHolderText);

    const gameContext = useContext(GameContext);

    const gameStateRef = React.useRef<any>();

    const settingsRef = React.useRef<HTMLDivElement>(null);

    const roomURLRef = React.useRef<HTMLInputElement>(null);

    const isNotHost = !gameContext.gameState.players.find((player: any) => player.isYou).isHost;

    const url = `${window.location.origin}/${gameContext.gameState.lobbyID}`

    useEffect(() => {
        gameStateRef.current = gameContext.gameState;
    }, [gameContext.gameState]);

    useEffect(() => {
        return () => console.log('WaitRoom useEffect cleanup');
    }, [])

    const startGame: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        ws.send(JSON.stringify({
            type: MessageType.StartGame,
        }));
    }

    const setRounds: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            rounds: e.target.value,
        });
        ws.send(JSON.stringify({
            type: MessageType.SetRounds,
            data: e.target.value
        }));
    }

    const setDrawTime: ChangeEventHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
        gameContext.updateGameState({
            drawTime: e.target.value,
        });
        ws.send(JSON.stringify({
            type: MessageType.SetDrawTime,
            data: e.target.value
        }));
    }

    const copyURL: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        roomURLRef.current!.select();
        document.execCommand('copy');
        console.log(roomURLRef.current!.defaultValue);
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
            <input className='absolute top-0 left-0 opacity-0 pointer-events-none' defaultValue={url} ref={roomURLRef}/>
            <div className='flex flex-col'>
                <div className='flex mb-4'>
                    <div className='flex flex-col'>
                        <div className='border-2 border-gray-300 border-opacity-25 mr-4 shadow-lg' ref={settingsRef}>
                            <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Settings</div>
                            <div className='bg-white p-2'>
                                <label htmlFor='rounds' className='select-none'>Rounds</label>
                                <select name='rounds' disabled={isNotHost} id='rounds' className='block w-full mb-2 border border-black  disabled:opacity-50' value={gameContext.gameState.rounds} onChange={setRounds}>
                                    {rounds}
                                </select>
                                <label htmlFor='drawTime' className='select-none'>Draw time in seconds</label>
                                <select name='drawTime' disabled={isNotHost} id='drawTime' className='block block w-full mb-2 border border-black  disabled:opacity-50' value={gameContext.gameState.drawTime} onChange={setDrawTime}>
                                    {drawTimes}
                                </select>
                                <button disabled={isNotHost} className='bg-gray-200 hover:bg-gray-100 block w-full p-2 disabled:opacity-50' onClick={startGame}>Start Game</button>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <div
                            className='border-2 border-gray-300 border-opacity-25 flex flex-1 flex-col overflow-y-auto shadow-lg'
                            style={{ maxHeight: settingsRef.current ? settingsRef.current!.offsetHeight : '' }}
                        >
                            <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Players</div>
                            <div className='flex flex-1 flex-col bg-white items-start p-2 min-h-0 overflow-y-auto'>
                                {playerItems}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='border-2 border-gray-300 border-opacity-25 shadow-lg'>
                    <div className='text-center p-2 border-b-2 border-gray-200 bg-gray-200 select-none font-medium'>Invite your friends!</div>
                    <div className='flex bg-white p-2'>
                        <textarea readOnly rows={1} className='border border-black mr-2 p-2 flex-auto resize-none text-center' value={roomURL} onMouseEnter={showURL} onMouseLeave={hideURL}></textarea>
                        <button className='bg-gray-200 hover:bg-gray-100 block block p-2 flex-none' onClick={copyURL}>Copy</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
