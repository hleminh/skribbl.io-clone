import React, { useEffect, useState } from 'react';

export default function ChatMessageBubble(props: { children: String, withFadeOut?: boolean }) {
    const [visible, setVisible] = useState(false);
    const [visibleTimer, setVisibleTimer] = useState<NodeJS.Timeout>();

    console.log('chat message bubble render');

    useEffect(() => {
        if (props.children !== '' && props.withFadeOut) {
            setVisible(true);
            setVisibleTimer(setTimeout(() => {
                setVisible(false);
            }, 3000));
        }
        return () => {
            clearTimeout(visibleTimer!);
        }
    }, [props.children]);

    return (
        <div
            className='absolute inline-block bg-gray-200 ml-1 flex items-center p-2 top-0 left-4 bottom-0 pointer-events-none z-10 max-w-xs'
            style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 500ms ease-in-out'
            }}>
            <div
                className='absolute bg-gray-200 w-2 h-2 right-full'
                style={{
                    transformOrigin: 'center',
                    transform: 'translateX(50%) rotate(45deg)',
                }}>
                &nbsp;
            </div>
            <div className='overflow-hidden overflow-ellipsis'>{props.children}</div>
        </div>
    )
}
