import { App, TemplatedApp, HttpRequest, WebSocket, HttpResponse } from 'uWebSockets.js';
import PlayerManager from './manager/PlayerManager';
import LevelManager from './manager/LevelManager';
import { sleep } from './tools/Utils';
import { createLogger, Logger } from './tools/logger';

export class Server {
    private readonly log: Logger = createLogger('Server');
    private port: number;
    private hub: TemplatedApp;
    private isTick: boolean = false;
    public fps: number = 1;

    constructor(port: number = 8005) {
        this.port = port;
        this.hub = App()
            .ws('/*', {
                open: (socket: WebSocket, req: HttpRequest) => {
                    PlayerManager.AddPlayer(socket);
                    // ...
                    // this.log.info('Connected');
                },
                close: (socket: WebSocket, code: number, msg: ArrayBuffer) => {
                    PlayerManager.RemovePlayer(socket);
                    // ...
                    // this.log.info('Disconnect');
                },
                message: (socket: WebSocket, message: ArrayBuffer, isBin: boolean) => {
                    PlayerManager.OnMessage(socket, message);
                },
            })
            .any('/*', (res: HttpResponse, req: HttpRequest) => {
                res.end('HelloW');
            });
    }

    /**
     * Run the server
     */
    public async Run() {
        this.log.info(`Starting server...`);

        await LevelManager.InitializeLevels();

        const socket = await new Promise(resolve => this.hub.listen(this.port, socket => resolve(socket)));
        if (!socket) {
            throw Error(`Could not listen on port ${this.port}.`);
        }

        this.log.info(`The server is listening on port ${this.port}`);
        this.RunTick();
    }

    RunTick() {
        this.isTick = true;
        this.Tick()
            .then()
            .catch(e => console.error(e));
    }

    private async Tick() {
        if (!this.isTick) return;
        LevelManager.Tick();

        await sleep(1e3 / this.fps);
        this.Tick();
    }
}
