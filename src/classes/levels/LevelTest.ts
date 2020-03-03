import Level from '../Level';
import { Point } from '../../Types';
import { TextObject, TeleportObject } from '../GameObject';

export default class LevelTest extends Level {
    name = 'Test';
    spawn: Point = [200, 50];

    OnInit() {
        this.AddGameObject(new TextObject([20, 60], 24, true, 'HelloW'));
        this.AddGameObject(new TextObject([320, 180], 24, true, 'Colored text', 'fa15c1'));
        this.AddGameObject(new TeleportObject([10, 10, 30, 30]));
    }
}
