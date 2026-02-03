export = ChatLogStorage;
/** @typedef {import('mongodb').Db} Db */
/**
 * Storage for conversation logs
 *
 * @class
 */
declare class ChatLogStorage extends BaseStorage<any> {
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} [isCosmo]
     * @param {string|Promise<string>} [secret]
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName?: string, log?: {
        error: Function;
        log: Function;
    }, isCosmo?: boolean, secret?: string | Promise<string>);
    muteErrors: boolean;
    _secret: string | Promise<string>;
    /**
     * Interate history
     * all limits are inclusive
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} [limit]
     * @param {number} [endAt] - iterate backwards to history
     * @param {number} [startAt] - iterate forward to last interaction
     * @returns {Promise<object[]>}
     */
    getInteractions(senderId: string, pageId: string, limit?: number, endAt?: number, startAt?: number): Promise<object[]>;
    /**
     * Log single event
     *
     * @param {string} senderId
     * @param {object[]} responses - list of sent responses
     * @param {object} request - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    log(senderId: string, responses?: object[], request?: object, metadata?: object): Promise<any>;
    _storeLog(event: any): Promise<void>;
    /**
     * Log single event
     *
     * @method
     * @name ChatLog#error
     * @param {any} err - error
     * @param {string} senderId
     * @param {object[]} [responses] - list of sent responses
     * @param {object} [request] - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    error(err: any, senderId: string, responses?: object[], request?: object, metadata?: object): Promise<any>;
}
declare namespace ChatLogStorage {
    export { Db };
}
import BaseStorage = require("./BaseStorage");
type Db = import("mongodb").Db;
