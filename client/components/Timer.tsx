import React, { useEffect, useRef, useState } from 'react';
import { RiTimerLine } from 'react-icons/ri';

export default function Timer(props: { time: number, width: number }) {
    const timerIconRef = useRef<HTMLDivElement>(null);
    const timerProgressRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState(props.time);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(time - 1);
            if (time <= 0) {
                setTime(props.time);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [time]);

    return (
        <div className='flex mb-2' style={{ width: props.width }}>
            <div className='flex-none flex items-center pr-2 pl-2 border border-black rounded-tl-full rounded-bl-full' ref={timerIconRef}>
                <RiTimerLine />
            </div>
            <div className='flex-auto bg-gray-200 border border-box border-l-0 border-black rounded-tr-full rounded-br-full overflow-hidden'>
                <div 
                    className='text-right mr-2 text-white' 
                    style={{ 
                        background: time > 30 ? 'green' : ( time > 10 ? 'orange' : 'red'), 
                        width: timerIconRef.current ? time * (props.width - timerIconRef.current!.offsetWidth) / props.time : '100%', 
                        transition: 'width 1s linear, background-color 1s linear',
                        height: '100%'
                    }} 
                    ref={timerProgressRef}
                >
                    <div className='mr-2 pointer-events-none'>{time}</div>
                </div>
            </div>
        </div>
    )
}
