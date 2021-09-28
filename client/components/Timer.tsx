import React, { useContext, useEffect, useRef, useState } from 'react';
import { RiTimerLine } from 'react-icons/ri';
import { RoundState } from '../models/RoundState';
import { GameContext } from '../pages/_app';
import { get } from './WebSocket';

export default function Timer(props: { time: number }) {
    const [time, setTime] = useState(props.time);

    const gameContext = useContext(GameContext);
    const timeRef = useRef<number>(time);

    console.log('timer render');

    useEffect(() => {
        timeRef.current = time;
    }, [time]);

    useEffect(() => {
        console.log('timer useEffect');
        return () => console.log('timer useEffect clean up');
    }, [])

    useEffect(() => {
        if (gameContext.gameState.roundState == RoundState.Ongoing) {
            const timer = setInterval(() => {
                setTime(time => time - 1);
                if (timeRef.current <= 0) {
                    setTime(props.time);
                }
            }, 1000);
            return () => {
                clearInterval(timer);
                setTime(props.time);
            }
        }
    }, [gameContext.gameState.roundState]);

    return (
        <div className='flex border-gray-300 border-2 box-content border-opacity-25 shadow-lg'>
            <div className='bg-gray-200 flex-none flex items-center pr-2 pl-2 border-gray-200'>
                <RiTimerLine />
            </div>
            <div className='flex-auto bg-white overflow-hidden'>
                <div
                    className='border-2 border-white text-right text-white pr-2'
                    style={{
                        background: time > Math.floor(props.time * 0.5) ? 'green' : (time > Math.floor(props.time * 0.2) ? 'orange' : 'red'),
                        width: `${100 - 100 * (props.time - time) / (props.time) }%`,
                        transition: 'width 1s linear, background-color 1s linear',
                        height: '100%'
                    }}
                >
                    <div className='select-none font-medium'>{time}</div>
                </div>
            </div>
        </div>
    )
}
