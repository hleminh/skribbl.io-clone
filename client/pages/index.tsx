import dynamic from 'next/dynamic';
import React, { useContext } from 'react';
import CreateRoom from '../components/CreateRoom';
import { LobbyState } from '../models/LobbyState';
import { GameContext } from './_app';

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

    const render = (lobbyState: LobbyState) => {
        switch (lobbyState) {
            case LobbyState.Wait:
                return <WaitRoom />
            case LobbyState.Play:
            case LobbyState.Reveal:
                return <PlayRoom />
            default:
                return <CreateRoom />
        }
    }

    return (
        <div className='ml-64 md:ml-32 sm:ml-0 mr-64 md:mr-32 sm:mr-0 mt-4'>
            {render(gameContext.gameState.lobbyState)}
        </div>
    )
}
