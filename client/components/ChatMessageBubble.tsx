import React, { useEffect, useRef, useState } from 'react';

export default function ChatMessageBubble(props: { children: String, withFadeOut?: boolean }) {
    const [visible, setVisible] = useState(false);
    const visibleTimer = useRef<NodeJS.Timeout>();

    console.log('chat message bubble render');

    useEffect(() => {
        if (props.children !== '' && props.withFadeOut) {
            setVisible(true);
            visibleTimer.current = setTimeout(() => {
                setVisible(false);
            }, 3000);
        }
        return () => {
            clearTimeout(visibleTimer.current!);
        }
    }, [props.children]);

    return (
        <div
            className='absolute inline-flex bg-gray-200 ml-1 items-center p-2 top-0 left-4 bottom-0 pointer-events-none z-10 max-w-xxs'
            style={{
                opacity: visible ? 0.9 : 0,
                transition: 'opacity 500ms ease-in-out'
            }}>
            <div
                className='absolute bg-gray-200 w-2 h-2 right-full select-none'
                style={{
                    transformOrigin: 'center',
                    transform: 'translateX(50%) rotate(45deg)',
                }}>
                &nbsp;
            </div>
            <div className='overflow-hidden overflow-ellipsis whitespace-nowrap select-none'>{props.children}</div>
        </div>
    )
}
