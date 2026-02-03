export = BotConfigStorage;
/**
 * Storage for wingbot.ai conversation config
 *
 * @class
 */
declare class BotConfigStorage {
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName?: string);
    _mongoDb: import("mongodb").Db | (() => Promise<Db>);
    _collectionName: string;
    /**
     * @type {Collection}
     */
    _collection: Collection;
    /**
     * @returns {Promise<Collection>}
     */
    _getCollection(): Promise<Collection>;
    /**
     * Returns botUpdate API for wingbot
     *
     * @param {Function} [onUpdate] - async update handler function
     * @param {Function|string[]} [acl] - acl configuration
     * @returns {{updateBot:Function}}
     */
    api(onUpdate?: Function, acl?: Function | string[]): {
        updateBot: Function;
    };
    /**
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    invalidateConfig(): Promise<any>;
    /**
     * @returns {Promise<number>}
     */
    getConfigTimestamp(): Promise<number>;
    /**
     * @template T
     * @param {T} newConfig
     * @param {string} [id]
     * @returns {Promise<T>}
     */
    updateConfig<T>(newConfig: T, id?: string): Promise<T>;
    /**
     *
     * @param {string} id
     * @param {object} newConfig
     */
    setConfig(id: string, newConfig: object): Promise<void>;
    /**
     * @param {string} [id]
     * @returns {Promise<object | null>}
     */
    getConfig(id?: string): Promise<object | null>;
}
declare namespace BotConfigStorage {
    export { BaseConfig, Db, Collection };
}
type BaseConfig = {
    [key: string]: any;
} & {
    _id: string;
};
type Db = import("mongodb").Db;
type Collection = import("mongodb").Collection<BaseConfig>;
