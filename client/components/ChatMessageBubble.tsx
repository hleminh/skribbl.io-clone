import React, { useEffect, useState } from 'react';

export default function ChatMessageBubble(props: { children: string, withFadeOut?: boolean }) {
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
            className='bg-gray-200 flex items-center p-2 left-full mb-2 ml-2 top-0 bottom-0 absolute rounded pointer-events-none z-10'
            style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 500ms ease-in-out'
            }}>
            <div 
                className='bg-gray-200 w-1.5 h-1.5 right-full absolute' 
                style={{
                    transformOrigin: 'center',
                    transform: 'translateX(50%) rotate(45deg)',
                }}>
                    &nbsp;
            </div>
            {props.children}
        </div>
    )
}
