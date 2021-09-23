export enum MessageType {
    Draw = 'draw',
    Fill = 'fill',
    ClearCanvas = 'clearCanvas',
    Chat = 'chat',
    Info = 'info',
    Alert = 'alert',
    Notify = 'notify',
    GuessedChat = 'guessedChat',
    SetDrawTime = 'setDrawTime',
    SetRounds = 'setRounds',
    LobbyWait = 'lobbyWait',
    LobbyPlay = 'lobbyPlay',
    LobbyReveal = 'lobbyReveal',
    RoundWait = 'RoundWait',
    RoundOngoing = 'roundOngoing',
    RoundReveal = 'roundReveal',
    RoundChooseWord = 'roundChooseWord',
    PlayerLeave = 'playerLeave',
    PlayerJoin = 'playerJoin',
    PlayerGuessed = 'playerGuessed',
    PlayerDrawing = 'playerDrawing',
    GetWordChoices = 'getWordChoices',
    SetWordChoices = 'setWordChoices',
    SetWord = 'setWord',
    ChooseWord = 'chooseWord',
    GetGameState = 'getGameState',
    SetGameState = 'setGameState',
    StartGame = 'startGame',
    QuitGame = 'quitGame',
    StartNextRound = 'startNextRound',
    StartNextTurn = 'startNextTurn',
    RoundTurnReveal = 'roundTurnReveal',
    WordReveal = 'wordReveal',
    GetSummary = 'getSummary',
    SetSummary = 'setSummary',
    CloseConnection = "closeConnection"
}
