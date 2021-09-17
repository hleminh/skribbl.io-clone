import React, { useState } from 'react';
import { MouseEventHandler } from 'react';

export default function Tooltip(props: { children: any, text: string }) {

    const [show, setShow] = useState(false);

    const showTooltip: MouseEventHandler = (e: React.MouseEvent) => {
        setShow(true);
    }

    const hideTooltip: MouseEventHandler = (e: React.MouseEvent) => {
        setShow(false);
    }

    return (
        <div
            className='relative flex items-center'
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            <div
                className='bg-white inline-block absolute left-0 right-0 text-center pointer-events-none'
                style={{
                    width: '100%',
                    bottom: '105%',
                    visibility: show ? 'visible' : 'hidden',
                    opacity: show ? 0.9 : 0,
                    transition: 'opacity 100ms linear'
                }}
            >
                {props.text}
            </div>
            {props.children}
        </div>
    )
}
