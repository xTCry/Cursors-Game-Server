import { Server } from './Server';

const server = new Server();
server.fps = 10;
server
    .Run()
    .then()
    .catch(e => console.error(e));
