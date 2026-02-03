export = StateStorage;
/**
 * @typedef {object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {object} state
 */
/**
 * @typedef {object} StateCondition
 * @prop {string} [search]
 * @prop {string[]} [senderIds]
 * @prop {string} [pageId]
 */
/** @typedef {import('mongodb').Db} Db */
/**
 * Storage for chat states
 *
 * @class
 */
declare class StateStorage extends BaseStorage<any> {
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean|number} isCosmo - boolean or number of failures in last 10min to kill app
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName?: string, log?: {
        error: Function;
        log: Function;
    }, isCosmo?: boolean | number);
    logCollisionsAsErrors: boolean;
    /**
     * Add custom indexing rule
     *
     * @param {object} index
     * @param {object} options
     * @param {string} options.name
     * @deprecated
     */
    addCustomIndex(index: object, options: {
        name: string;
    }): void;
    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    getState(senderId: string, pageId: string): Promise<State | null>;
    /**
     * Load state from database and lock it to prevent another reads
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page identifier
     * @param {object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<object>} - conversation state
     */
    getOrCreateAndLock(senderId: string, pageId: string, defaultState?: object, timeout?: number): Promise<object>;
    /**
     *
     * @param {StateCondition} condition
     * @param {number} limit
     * @param {string} lastKey
     * @returns {Promise<{data:State[],lastKey:string}>}
     */
    getStates(condition?: StateCondition, limit?: number, lastKey?: string): Promise<{
        data: State[];
        lastKey: string;
    }>;
    _mapState(state: any): any;
    /**
     * Save the state to database
     *
     * @param {object} state - conversation state
     * @returns {Promise<object>}
     */
    saveState(state: object): Promise<object>;
}
declare namespace StateStorage {
    export { State, StateCondition, Db };
}
import BaseStorage = require("./BaseStorage");
type State = {
    senderId: string;
    pageId: string;
    state: object;
};
type StateCondition = {
    search?: string;
    senderIds?: string[];
    pageId?: string;
};
type Db = import("mongodb").Db;
