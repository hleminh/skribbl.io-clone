import { PlayerScore } from "./PlayerScore";

export interface Summary {
    word: string,
    reason: string,
    scores: PlayerScore[]
}
