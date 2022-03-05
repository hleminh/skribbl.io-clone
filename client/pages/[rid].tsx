import React, { useContext, useEffect } from 'react';
import dynamic from 'next/dynamic'
import { NextRouter, useRouter } from 'next/router';
import { get } from '../components/WebSocket';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { GameContext } from '../pages/_app';
import { LobbyState } from '../models/LobbyState';

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

    const render = (lobbyState: LobbyState) => {
        switch (lobbyState) {
            case LobbyState.Wait:
                return <WaitRoom /> 
            case LobbyState.Play:
            case LobbyState.Reveal:
                return <PlayRoom />
            default:
                return <JoinRoom roomId={roomId}/>
        }
    }

    useEffect(() => {

        return () => console.log('room useEffect clean up');

    }, []);

    return (
        <div className='ml-64 md:ml-32 sm:ml-0 mr-64 md:mr-32 sm:mr-0 mt-4'>
            {render(gameContext.gameState.lobbyState)}
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
    const res = await fetch(`http://${process.env.NEXT_PUBLIC_REACT_APP_API_BASE_URL}/${context.params!.rid}`, {
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
