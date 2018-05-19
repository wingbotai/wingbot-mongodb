/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

/**
 * Storage for chat states
 *
 * @class
 */
class StateStorage {

    /**
     *
     * @param {mongodb.Db} mongoDb
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

    _getCollection () {
        if (this._collection === null) {
            this._collection = this._mongoDb.collection(this._collectionName);
        }
        return this._collection;
    }

    /**
     * Load state from database and lock it to prevent another reads
     *
     * @param {any} senderId - sender identifier
     * @param {Object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<Object>} - conversation state
     */
    async getOrCreateAndLock (senderId, defaultState = {}, timeout = 300) {
        const now = Date.now();

        const c = this._getCollection();

        const res = await c.findOneAndUpdate({
            _id: senderId,
            lock: { $lt: now - timeout }
        }, {
            $setOnInsert: {
                senderId,
                state: defaultState,
                lastSendError: null,
                off: false
            },
            $set: {
                lock: now
            }
        }, {
            upsert: true,
            returnOriginal: false
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

        const c = this._getCollection();

        await c.updateOne({
            _id: state.senderId
        }, {
            $set: state
        }, {
            upsert: true
        });

        return state;
    }

}

module.exports = StateStorage;
