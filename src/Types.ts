export enum ClientMsg {
    MOVE = 1,
    CLICK = 2,
}

export enum ServerMsg {
    SET_CLIENT_ID = 0,
    UPDATE_DATA = 1,
    TELEPORT_CLIENT = 5,
}

export interface Point {
    x: number;
    y: number;
}
