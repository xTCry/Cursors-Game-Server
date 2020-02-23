import { App, TemplatedApp, HttpRequest, WebSocket, HttpResponse } from 'uWebSockets.js';
import PlayerManager from "./manager/PlayerManager";
import LevelManager from './manager/LevelManager';

export class Server {
    private port: number;
    private hub: TemplatedApp;

    constructor(port: number = 8005) {
        this.port = port;
        this.hub = App()
            .ws('/*', {
                open: (socket: WebSocket, req: HttpRequest) => {
					PlayerManager.AddPlayer(socket);
                    // ...
                    console.log('• Connected');
                },
                close: (socket: WebSocket, code: number, msg: ArrayBuffer) => {
					PlayerManager.RemovePlayer(socket);
                    // ...
                    console.log('• Disconnect');
                },
                message: (socket: WebSocket, message: ArrayBuffer, isBin: boolean) => {
                    PlayerManager.OnMessage(socket, message);
                }
            })
            .any('/*', (res: HttpResponse, req: HttpRequest) => {
                res.end('HelloW');
            });
    }

    /**
     * Run the server
     */
    public Run() {
        this.hub.listen(this.port, socket => {
            if (!socket) {
                throw Error(`Failed to run listening on port.`);
            }
            console.log(`• The server is listening on port ${this.port}`);
            this.RunTick();
        });
    }

    RunTick() {
        setInterval(()=>{
            LevelManager.Tick();
        }, 1e3 / 4);
    }

}
