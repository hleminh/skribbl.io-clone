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

export const hex2RGB = (hex: string) => {
    let m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)!;
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}
