import '../styles/globals.css';
import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../models/GameState';
import { LobbyState } from '../models/LobbyState';
import { RoundState } from '../models/RoundState';

export const GameContext = React.createContext<any>(null);

function MyApp({ Component, pageProps }: AppProps) {
    const [gameState, setGameState] = useState<GameState>({
        lobbyState: LobbyState.Unset,
        roundState: RoundState.Unset,
        rounds: -1,
        drawTime: -1,
        word: '',
        lobbyId: -1,
        players: [],
        currentRound: -1,
        chatMessages: []
    });

    const gameStateRef = useRef<any>(null);

    const updateGameState = (newState: GameState) => {
        setGameState(prevState => ({ ...prevState, ...newState }));
    }

    const getGameState = () => {
        return gameStateRef.current;
    }

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    return (
        <GameContext.Provider value={{ gameState: gameState, updateGameState: updateGameState, getGameState: getGameState }}>
            <Component {...pageProps} />
        </GameContext.Provider>
    )
}
export default MyApp;
