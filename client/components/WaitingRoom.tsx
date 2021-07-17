import React, { ReactNode, useRef } from 'react';
import { MouseEventHandler } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';

export default function WaitingRoom(props: { children?: ReactNode }) {
    const roundsRef = useRef<HTMLSelectElement>(null);
    const drawTimeRef = useRef<HTMLSelectElement>(null);
    const roomURLRef = useRef<HTMLDivElement>(null);

    const startGame: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log('Rounds: ', roundsRef.current!.value);
        console.log('Draw time in seconds: ', drawTimeRef.current!.value);
    }

    const copyURL: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log(roomURLRef.current!.innerHTML);
    }

    const rounds = Array.from({ length: 9 }, (x, i) => i + 2).map((number) => <option value={number} key={number}>{number}</option>);
    const drawTimes = Array.from({ length: 16 }, (x, i) => 30 + i * 10).map((number) => <option value={number} key={number}>{number}</option>);

    return (
        <div className='absolute top-1 right-1 bottom-1 left-1 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div className='flex flex-col'>
                <div className='flex mb-4'>
                    <div className='bg-white border border-black rounded mr-4'>
                        <div className='text-center p-2 border-b border-black select-none'>Settings</div>
                        <div className='p-2'>
                            <label htmlFor='rounds' className='select-none'>Rounds</label>
                            <select name='rounds' id='rounds' className='block w-full mb-2 border border-black rounded' ref={roundsRef}>
                                {rounds}
                            </select>
                            <label htmlFor='drawTime' className='select-none'>Draw time in seconds</label>
                            <select name='drawTime' id='drawTime' className='block block w-full mb-2 border border-black rounded' ref={drawTimeRef}>
                                {drawTimes}
                            </select>
                            <button onClick={startGame} className='bg-gray-200 hover:bg-gray-100 block block w-full p-2 rounded'>Start Game</button>
                        </div>
                    </div>
                    <div className='bg-white border border-black rounded'>
                        <div className='text-center p-2 border-b border-black select-none'>Players</div>
                        <div className='p-2'>
                            <div className='flex items-center justify-center mb-2 select-none'>
                                <BsFillPersonFill className='inline-block mr-2 ' /> Player 1
                            </div>
                            <div className='flex items-center justify-center select-none'>
                                <BsFillPersonFill className='inline-block mr-2' /> Player 2
                            </div>
                        </div>
                    </div>
                </div>
                <div className='bg-white border border-black rounded'>
                    <div className='text-center p-2 border-b border-black select-none'>Invite your friends!</div>
                    <div className='flex p-2'>
                        <div className='border border-black mr-2 p-2 rounded flex-auto' ref={roomURLRef}>http://test.com</div>
                        <button onClick={copyURL} className='bg-gray-200 hover:bg-gray-100 block block p-2 rounded flex-none'>Copy</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
