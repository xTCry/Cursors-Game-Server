import { App, TemplatedApp, HttpRequest, WebSocket, HttpResponse } from 'uWebSockets.js';

export class Server {
	private port: number;
	private hub: TemplatedApp;

	constructor(port: number = 8005) {
		this.port = port;
		this.hub = App().ws('/*', {
			open(socket: WebSocket, req: HttpRequest) {
				// ...
			},
			close(socket: WebSocket, code: number, msg: ArrayBuffer) {
				// ...
			},
			message(socket: WebSocket, msg: ArrayBuffer, isBin: boolean) {
				// ...
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
