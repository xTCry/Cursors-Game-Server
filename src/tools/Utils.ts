import { Point, EGameObjectType } from '../Types';

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const CreateUnduplicator = (target: Array<any> = []) =>
    new Proxy<Array<any>>(target, {
        set(target, p, value) {
            // console.log(`[U] Set`, p, value instanceof Level ? value.constructor.name : value);
            if (target.includes(value)) {
                // console.log(`[U] Detectd duplicate`);
                return false;
            }

            target[p] = value;
            return true;
        },
    });

export const equalPoint = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1];

export const walk = (pos1: Point, pos2: Point, map: Uint8Array) => {
    if (equalPoint(pos1, pos2)) return pos2;

    let [x, y] = pos1;
    let [dx, dy] = [Math.abs(pos2[0] - x), -Math.abs(pos2[1] - y)];
    let sx = x < pos2[0] ? 1 : -1;
    let sy = y < pos2[1] ? 1 : -1;
    let err = dx + dy;
    let err2 = err * 2;

    while (equalPoint(pos1, pos2)) {
        if (err2 >= dy) {
            err += dy;
            x += sx;
        }

        if (err2 <= dx) {
            err += dx;
            y += sy;
        }

        if (x >= 400 || y >= 300 || map[x + 400 * y] & (1 << EGameObjectType.WALL)) break;

        pos1 = [x, y];
        err2 = err * 2;
    }

    return pos1;
};

export const unstuck = (pos: Point, map: Uint8Array): Point => {
    const collides = ([x, y]: Point) => !!(map[x + 400 * y] & (1 << EGameObjectType.WALL));

    if (pos[0] < 400 && pos[1] < 300 && !collides(pos)) return pos;

    let explored = new Uint8Array(12e3);
    let queue: Array<Point> = [];
    const shouldQueue = ([x, y]: Point) => {
        if (x < 400 && y < 300 && !explored[x + 400 * y]) {
            explored[x + 400 * y] = 1;
            return true;
        }
        return false;
    };

    queue.push(pos);

    do {
        let [x, y] = queue.shift();

        if (x < 400 && y < 300) {
            x--;
            if (shouldQueue([x, y])) {
                if (!collides([x, y])) return [x, y];
                queue.push([x, y]);
            }

            x += 2;
            if (shouldQueue([x, y])) {
                if (!collides([x, y])) return [x, y];
                queue.push([x, y]);
            }

            x--;
            y--;
            if (shouldQueue([x, y])) {
                if (!collides([x, y])) return [x, y];
                queue.push([x, y]);
            }

            y += 2;
            if (shouldQueue([x, y])) {
                if (!collides([x, y])) return [x, y];
                queue.push([x, y]);
            }
        }
    } while (queue.length);

    return pos;
};
