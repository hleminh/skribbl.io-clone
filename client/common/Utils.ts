import { PlayerScore } from '../models/PlayerScore';

export const sortByTurnScore = (a: PlayerScore, b: PlayerScore) => {
    return b.turnScore - a.turnScore;
}

export const sortByRoundScore = (a: PlayerScore, b: PlayerScore) => {
    return b.roundScore - a.roundScore;
}

export const sortByGameScore = (a: PlayerScore, b: PlayerScore) => {
    return b.gameScore - a.gameScore;
}
