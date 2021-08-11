import React from 'react';
import { MouseEventHandler } from 'react';

export default function WoodChoose() {
    const chooseWord: MouseEventHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        console.log(e.currentTarget.value);
    }

    return (
        <div className='absolute top-1 right-1 bottom-1 left-1 flex items-center justify-center backdrop-filter backdrop-blur-sm'>
            <div
                className='bg-white border border-black rounded'
            >
                <div className='text-center p-2 border-b border-black select-none'>Choose a word</div>
                <div className='flex justify-around p-2'>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2 mr-2' value={'1'} onClick={chooseWord}>1</button>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2 mr-2' value={'22'} onClick={chooseWord}>22</button>
                    <button className='bg-gray-200 hover:bg-gray-100 p-2' value={'333'} onClick={chooseWord}>333</button>
                </div>
            </div>
        </div>
    )
}
