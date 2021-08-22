let ws: WebSocket;

export const init = (roomId: string, playerName: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(`ws://localhost:6969/${roomId}?playerName=${playerName}`);

        ws.addEventListener('message', (event) => {
            resolve(event.data);
        });
    
        ws.onerror = (event) => {
            reject();
        }

        ws.onopen = (event) => {
            ws.send(JSON.stringify({
                "directive": "getGameState"
            }));
        }
    })
 }

export const get = (): WebSocket => {
    return ws;
}
