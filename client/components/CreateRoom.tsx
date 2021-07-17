import React, { ReactNode, useRef } from 'react';
import { MouseEventHandler } from 'react';

export default function CreateRoom(props: { children?: ReactNode }) {
    const nameInputRef = useRef<HTMLInputElement>(null);

    const createRoom: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log(nameInputRef.current!.value);
    }

    return (
        <div className='absolute top-1 right-1 bottom-1 left-1 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div
                className='bg-white border border-black rounded'
            >
                <div className='text-center p-2 border-b border-black select-none'>Create Room</div>
                <div className='p-2'>
                    <label htmlFor='name' className='select-none'>Player Name</label>
                    <input name='name' id='name' className='border border-black w-full mb-2 p-2' ref={nameInputRef}></input>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2 w-full' onClick={createRoom}>Create</button>
                </div>
            </div>
        </div>
    )
}
