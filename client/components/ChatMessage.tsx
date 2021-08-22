import React, { ReactNode } from 'react';

export default function ChatMessage(props: { children: ReactNode }) {

    return (
        <div className='bg-white rounded mb-2 p-2'>
            {props.children}
        </div>
    )
}
