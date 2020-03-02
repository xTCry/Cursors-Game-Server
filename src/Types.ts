export enum ClientMessageType {
    MOVE = 1,
    CLICK = 2,
    DRAW = 3,
}

export enum ServerMessageType {
    SET_CLIENT_ID = 0,
    UPDATE_DATA = 1,
    TELEPORT_CLIENT = 5,
}

export interface IPoint {
    x: number;
    y: number;
}
export type Point = [number, number];
