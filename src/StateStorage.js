/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

const USER_INDEX = 'user-page-index';

/**
 * @typedef {Object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {Object} state
 */

/**
 * Storage for chat states
 *
 * @class
 */
class StateStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'states') {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;

        /**
         * @type {mongodb.Collection}
         */
        this._collection = null;
    }

    /**
     * @returns {Promise<mongodb.Collection>}
     */
    async _getCollection () {
        if (this._collection === null) {
            if (typeof this._mongoDb === 'function') {
                const db = await this._mongoDb();
                this._collection = db.collection(this._collectionName);
            } else {
                this._collection = this._mongoDb.collection(this._collectionName);
            }
            let indexExists;
            try {
                indexExists = await this._collection.indexExists(USER_INDEX);
            } catch (e) {
                indexExists = false;
            }
            if (!indexExists) {
                await this._collection.createIndex({
                    senderId: 1,
                    pageId: 1
                }, {
                    unique: true,
                    name: USER_INDEX,
                    dropDups: true
                });
            }
        }
        return this._collection;
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    async getState (senderId, pageId) {
        const c = await this._getCollection();
        return c.findOne({ senderId, pageId }, { projection: { _id: 0 } });
    }

    /**
     * Load state from database and lock it to prevent another reads
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page identifier
     * @param {Object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<Object>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, timeout = 300) {
        const now = Date.now();

        const c = await this._getCollection();

        const $setOnInsert = {
            senderId,
            state: defaultState,
            lastSendError: null,
            off: false
        };

        const $set = {
            lock: now
        };

        const $lt = now - timeout;

        const res = await c.findOneAndUpdate({
            senderId,
            pageId,
            lock: { $lt }
        }, {
            $setOnInsert,
            $set
        }, {
            upsert: true,
            returnOriginal: false,
            projection: {
                _id: 0
            }
        });

        return res.value;
    }

    /**
     * Save the state to database
     *
     * @param {Object} state - conversation state
     * @returns {Promise<Object>}
     */
    async saveState (state) {
        Object.assign(state, {
            lock: 0
        });

        const c = await this._getCollection();

        const { senderId, pageId } = state;

        await c.updateOne({
            senderId, pageId
        }, {
            $set: state
        }, {
            upsert: true
        });

        return state;
    }

}

module.exports = StateStorage;
