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
