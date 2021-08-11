import '../styles/globals.css'
import 'tailwindcss/tailwind.css'
import type { AppProps } from 'next/app'
import React, { useState } from 'react';

export const GameContext = React.createContext<any>(null);

function MyApp({ Component, pageProps }: AppProps) {
    const [gameState, setGameState] = useState({});

    const updateGameState = (newState: any) => {
        setGameState(prevState => ({ ...prevState, ...newState }));
    }

    return (
        <GameContext.Provider value={{ gameState: gameState, updateGameState: updateGameState }}>
            <Component {...pageProps} />
        </GameContext.Provider>
    )
}
export default MyApp
