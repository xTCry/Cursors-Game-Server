import { App, TemplatedApp, HttpRequest, WebSocket, HttpResponse } from 'uWebSockets.js';
import { BufferWriter, BufferReader } from './tools/Buffer';
import { ServerMsg, ClientMsg } from './Types';

export class Server {
    private port: number;
    private hub: TemplatedApp;

    private playersCount: number = 0;

    constructor(port: number = 8005) {
        this.port = port;
        this.hub = App()
            .ws('/*', {
                open: (socket: WebSocket, req: HttpRequest) => {
                    // ...
                    this.playersCount++;
                    console.log('• Connected', this.playersCount);

                    // Send player ID
                    const fast = BufferWriter.fast([[ServerMsg.SET_CLIENT_ID], [2020, 32]]);
                    socket.send(fast, true);
                },
                close: (socket: WebSocket, code: number, msg: ArrayBuffer) => {
                    // ...
                    this.playersCount--;
                    console.log('• Disconnect');
                },
                message: (socket: WebSocket, msg: ArrayBuffer, isBin: boolean) => {
                    console.log('• Message:', Buffer.from(msg));

                    const reader = new BufferReader(msg);
                    const type = reader.readU();
                    
                    switch (type) {
                        case ClientMsg.MOVE:
                            const x = reader.readU(16);
                            const y = reader.readU(16);
                            const ttl = reader.readU(32);
                            console.log(`Move: {${ttl}} [${x}:${y}]`);
                            break;
                    }
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
        });
    }
}
