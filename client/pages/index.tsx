import React, { Fragment } from 'react';
import dynamic from 'next/dynamic'
import Timer from '../components/Timer';
import WordChooser from '../components/WordChooser';
import WaitingRoom from '../components/WaitingRoom';
import CreateRoom from '../components/CreateRoom';

// import styles from '../styles/Home.module.css';

const Painter = dynamic(
    () => import('../components/Painter'),
    { ssr: false }
)

const Chat = dynamic(
    () => import('../components/Chat'),
    { ssr: false }
)

export default function Home() {
    return (
        <div className='flex relative'>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Timer time={60} width={800} />
                <Painter height={500} width={800} />
            </div>
            <div className='flex flex-col flex-auto items-center m-4'>
                <Chat height={500}></Chat>
            </div>
            {/* <WordChooser /> */}
            {/* <WaitingRoom /> */}
            {/* <CreateRoom /> */}
        </div>
    )
}
