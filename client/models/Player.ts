export interface Player {
    id: number,
    name: string,
    isHost:  boolean,
    isYou: boolean,
    isDrawing: boolean,
    isGuessed: boolean,
    turnScore: number,
    roundScore: number,
    gameScore: number
}
