/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

/**
 * Storage for conversation logs
 *
 * @class
 */
class ChatLogStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function}} [log] - console like logger
     */
    constructor (mongoDb, collectionName = 'chatlogs', log = console) {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;
        this._log = log;

        /**
         * @type {mongodb.Collection}
         */
        this._collection = null;

        this.muteErrors = true;
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
        }
        return this._collection;
    }

    /**
     * Log single event
     *
     * @param {string} senderId
     * @param {Object[]} responses - list of sent responses
     * @param {Object} request - event request
     * @returns {Promise}
     */
    log (senderId, responses = [], request = {}) {
        const log = {
            senderId,
            time: new Date(request.timestamp || Date.now()),
            request,
            responses
        };

        return this._getCollection()
            .then(c => c.insertOne(log))
            .catch((err) => {
                this._log.error('Failed to store chat log', err, log);

                if (!this.muteErrors) {
                    throw err;
                }
            });
    }

    /**
     * Log single event
     *
     * @method
     * @name ChatLog#error
     * @param {any} err - error
     * @param {string} senderId
     * @param {Object[]} [responses] - list of sent responses
     * @param {Object} [request] - event request
     * @returns {Promise}
     */
    error (err, senderId, responses = [], request = {}) {
        const log = {
            senderId,
            time: new Date(request.timestamp || Date.now()),
            request,
            responses,
            err: `${err}`
        };

        return this._getCollection()
            .then(c => c.insertOne(log))
            .catch((storeError) => {
                this._log.error('Failed to store chat log', storeError, log);

                if (!this.muteErrors) {
                    throw storeError;
                }
            });
    }

}

module.exports = ChatLogStorage;
