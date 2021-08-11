import dynamic from 'next/dynamic';
import React, { Fragment, useContext, useEffect } from 'react';
import CreateRoom from '../components/CreateRoom';
import { GameContext } from './_app';

// import styles from '../styles/Home.module.css';

const PlayRoom = dynamic(
    () => import('../components/PlayRoom'),
    { ssr: false }
)

const WaitRoom = dynamic(
    () => import('../components/WaitRoom'),
    { ssr: false }
)

export default function Home() {
    const gameContext = useContext(GameContext);

    const render = (stage: string) => {
        switch (stage) {
            case 'wait':
                return <WaitRoom />
            case 'play':
                return <PlayRoom />
            default:
                return <CreateRoom />
        }
    }

    return (
        <div className='w-full h-full'>
            {render(gameContext.gameState.stage)}
        </div>
    )
}
