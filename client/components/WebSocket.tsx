import { ChatMessageType } from "../models/ChatMessageType";
import { LobbyState } from "../models/LobbyState";
import { Message } from "../models/Message";
import { MessageType } from "../models/MessageType";
import { Player } from "../models/Player";
import { RoundState } from "../models/RoundState";
import { ReasonMessage } from "../constants/ReasonMessage";
import { RevealReason } from "../models/RevealReason";

let ws: WebSocket;

export const init = (gameContext: any, roomId: string, playerName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_REACT_APP_API_BASE_URL}/${roomId}?playerName=${playerName}`);

        ws.addEventListener('message', (event) => {
            const msg: Message = JSON.parse(event.data);
            switch (msg.type) {
                case MessageType.RoundReveal:
                    gameContext.updateGameState({
                        roundState: RoundState.Reveal
                    });
                    break;
                case MessageType.RoundChooseWord:
                    gameContext.updateGameState({
                        roundState: RoundState.ChooseWord
                    });
                    break;
                case MessageType.RoundOngoing:
                    gameContext.updateGameState({
                        roundState: RoundState.Ongoing
                    });
                    break;
                case MessageType.LobbyPlay:
                    gameContext.updateGameState({
                        lobbyState: LobbyState.Play
                    });
                    break;
                case MessageType.SetDrawTime:
                    const time = parseInt(JSON.parse(msg.data!));
                    gameContext.updateGameState({
                        drawTime: time
                    });
                    break;
                case MessageType.SetRounds:
                    const numberOfRounds = parseInt(JSON.parse(msg.data!));
                    gameContext.updateGameState({
                        rounds: numberOfRounds
                    });
                    break;
                case MessageType.SetGameState:
                    gameContext.updateGameState(JSON.parse(msg.data!));
                    break;
                case MessageType.WordReveal:
                    gameContext.updateGameState({
                        word: msg.data!
                    });
                    break;
                case MessageType.LobbyReveal:
                    gameContext.updateGameState({
                        roundState: RoundState.Wait,
                        lobbyState: LobbyState.Reveal
                    });
                    break;
                case MessageType.RoundTurnReveal:
                    gameContext.updateGameState({
                        roundState: RoundState.TurnReveal
                    });
                    break;
                case MessageType.PlayerGuessed:
                    const guessedPlayerId: number = Number.parseInt(msg.data!);
                    gameContext.updateGameState({
                        players: gameContext.getGameState().players.map((el: Player) => {
                            if (el.id === guessedPlayerId) {
                                el.isGuessed = true;
                            }
                            return el;
                        })
                    });
                    break;
                case MessageType.PlayerJoin:
                    const joinedPlayer: Player = JSON.parse(msg.data!);
                    gameContext.updateGameState({
                        players: gameContext.getGameState().players.concat([joinedPlayer])
                    });
                    break;
                case MessageType.PlayerLeave:
                    const leftPlayerId: number = Number.parseInt(msg.data!);
                    gameContext.updateGameState({
                        players: gameContext.getGameState().players.filter((el: Player) => el.id !== leftPlayerId)
                    });
                    break;
                case MessageType.PlayerDrawing:
                    const drawingPlayerId: number = Number.parseInt(msg.data!);
                    gameContext.updateGameState({
                        players:  gameContext.getGameState().players.map((el: Player) => {
                            if (el.id === drawingPlayerId) {
                                el.isDrawing = true;
                            }
                            return el;
                        })
                    });
                    break;
                case MessageType.Chat: {
                    const sender: Player = gameContext.getGameState().players.find((player: any) => player.id === msg.senderId);
                    gameContext.updateGameState({
                        chatMessages: gameContext.getGameState().chatMessages.concat([{
                            senderId: sender.id,
                            senderName: sender.name,
                            content: msg.data!,
                            type: ChatMessageType.Chat
                        }])
                    });
                    break;
                }
                case MessageType.GuessedChat:
                    const sender: Player = gameContext.getGameState().players.find((player: any) => player.id === msg.senderId);
                    gameContext.updateGameState({
                        chatMessages: gameContext.getGameState().chatMessages.concat([{
                            senderId: sender.id,
                            senderName: sender.name,
                            content: msg.data!,
                            type: ChatMessageType.GuessedChat
                        }])
                    });
                    break;
                case MessageType.Notify:
                    gameContext.updateGameState({
                        chatMessages: gameContext.getGameState().chatMessages.concat([{
                            content: msg.data!,
                            type: ChatMessageType.Notify
                        }])
                    });
                    break;
                case MessageType.Info:
                    gameContext.updateGameState({
                        chatMessages: gameContext.getGameState().chatMessages.concat([{
                            content: msg.data!,
                            type: ChatMessageType.Info
                        }])
                    });
                    break;
                case MessageType.Alert:
                    gameContext.updateGameState({
                        chatMessages: gameContext.getGameState().chatMessages.concat([{
                            content: msg.data!,
                            type: ChatMessageType.Alert
                        }])
                    });
                    break;
               
            };
        });

        ws.onerror = (event) => {
            reject(event);
        }

        ws.onopen = (event) => {
            ws.send(JSON.stringify({
                "type": MessageType.GetGameState
            }));
        }

        ws.onclose = (event) => {
            if (gameContext.getGameState().lobbyState !== LobbyState.Reveal) {
                let alertMsg: string;
                if (event.reason) {
                    alertMsg = ReasonMessage[event.reason];
                } else {
                    alertMsg = ReasonMessage[RevealReason.ConnectionError]
                }
                alert(alertMsg);
            }
            window.location.replace("/");
        }
    })
}

export const get = (): WebSocket => {
    return ws;
}
