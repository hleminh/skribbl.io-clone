import { LobbyState } from "./LobbyState";
import { RoundState } from "./RoundState";
import { Player } from "./Player";
import { ChatMessage } from "./ChatMessage";

export interface GameState {
    lobbyState: LobbyState,
    roundState: RoundState,
    rounds: number,
    drawTime: number,
    word: string,
    lobbyId: number,
    players: Player[],
    currentRound: number,
    chatMessages: ChatMessage[]
}
