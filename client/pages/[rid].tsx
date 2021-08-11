import React, { useContext, useEffect } from 'react';
import dynamic from 'next/dynamic'
import { NextRouter, useRouter } from 'next/router';
import { get } from '../components/WebSocket';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { GameContext } from '../pages/_app';

// import styles from '../styles/Home.module.css';

const PlayRoom = dynamic(
    () => import('../components/PlayRoom'),
    { ssr: false }
)

const WaitRoom = dynamic(
    () => import('../components/WaitRoom'),
    { ssr: false }
)

const JoinRoom = dynamic(
    () => import('../components/JoinRoom'),
    { ssr: false }
)

const ws = get();

export default function Room() {
    const router: NextRouter = useRouter();

    const roomId: string = router.query['rid'] as string;

    const gameContext = useContext(GameContext);

    console.log('room render');

    const render = (stage: string) => {
        switch (stage) {
            case 'wait':
                return <WaitRoom /> 
            case 'play':
                return <PlayRoom />
            default:
                return <JoinRoom roomId={roomId}/>
        }
    }

    useEffect(() => {

        return () => console.log('room useEffect clean up');

    }, []);

    return (
        <div className='w-full h-full'>
            {render(gameContext.gameState.stage)}
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
    const res = await fetch(`http://localhost:6969/${context.params!.rid}`, {
        method: 'OPTIONS',
    });

    if (res.status === 404) {
        return {
            notFound: true,
        }
    }

    return {
        props: {},
    }
}
