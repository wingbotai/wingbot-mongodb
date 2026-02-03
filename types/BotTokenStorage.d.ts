export = BotTokenStorage;
/**
 * @typedef {object} Token
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {string} token
 */
/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */
/**
 * Storage for webview tokens
 *
 * @class
 */
declare class BotTokenStorage {
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
     *
     * @param {string} token
     * @returns {Promise<Token|null>}
     */
    findByToken(token: string): Promise<Token | null>;
    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {{(): Promise<string>}} createToken
     * @returns {Promise<Token|null>}
     */
    getOrCreateToken(senderId: string, pageId: string, createToken?: {
        (): Promise<string>;
    }): Promise<Token | null>;
    _wait(ms: any): Promise<any>;
}
declare namespace BotTokenStorage {
    export { Token, Db, Collection };
}
type Token = {
    senderId: string;
    pageId: string;
    token: string;
};
type Db = import("mongodb").Db;
type Collection = import("mongodb").Collection;
