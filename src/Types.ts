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

export enum EWallColor {
    BLACK = 0x000000,
    WHITE = 0xFFFFFF,
    PINK = 0xFF9999,
    PORTAGE = 0x9999FF,
    YELLOW = 0xFFFF99,
    ELECTRIC_BLUE = 0x99FFFF,
    VIOLET = 0xFF99FF,
    NEON_BLUE = 0x3333FF,
}

export enum ETeleportColor {
    GREEN = 0,
    RED,
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

/**
 * @property X
 * @property Y
 * @property W
 * @property H
 */
export type Box = [number, number, number, number];

export interface IPlayersList {
    [key: number]: Player;
}
