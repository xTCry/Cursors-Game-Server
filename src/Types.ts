// import Player from './classes/Player';
import { Player } from './classes/Player';

export enum ClientMessageType {
    MOVE = 1,
    CLICK = 2,
    DRAW = 3,
}

export enum ServerMessageType {
    SET_CLIENT_ID = 0,
    UPDATE_DATA = 1,
    LOAD_LEVEL = 4,
    TELEPORT_CLIENT = 5,
}

export enum EGameObjectType {
    TEXT = 0,
    WALL,
    TELEPORT,
    AREA_COUNTER,
    BUTTON,
}

export interface IPoint {
    x: number;
    y: number;
}
/**
 * @property X
 * @property Y
 */
export type Point = [number, number];

export interface IPlayersList {
    [key: number]: Player;
}
