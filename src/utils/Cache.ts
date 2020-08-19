import * as NodeCache from 'node-cache'

export default class Cache {
    
    public static NewCache = new NodeCache({ useClones: false, deleteOnExpire: true, checkperiod: 600 });

    public static SetCache(key, state){
        const createCache = Cache.NewCache.set(key, state, 259200)
        return createCache
    }
    
    public static GetCache(key){
        const ExistCache = Cache.NewCache.get(key)
        return ExistCache
    }
}