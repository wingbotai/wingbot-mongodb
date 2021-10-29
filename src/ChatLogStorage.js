/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars
const BaseStorage = require('./BaseStorage');

const PAGE_SENDER_TIMESTAMP = 'pageId_1_senderId_1_timestamp_-1';
const TIMESTAMP = 'timestamp_1';

/**
 * Storage for conversation logs
 *
 * @class
 */
class ChatLogStorage extends BaseStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} isCosmo
     */
    constructor (mongoDb, collectionName = 'chatlogs', log = console, isCosmo = false) {
        super(mongoDb, collectionName, log, isCosmo);

        this.addIndex({
            pageId: 1,
            senderId: 1,
            timestamp: -1
        }, {
            name: PAGE_SENDER_TIMESTAMP
        });

        if (isCosmo) {
            this.addIndex({
                timestamp: 1
            }, {
                name: TIMESTAMP
            });
        }

        this.muteErrors = true;
    }

    /**
     * Interate history
     * all limits are inclusive
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} [limit]
     * @param {number} [endAt] - iterate backwards to history
     * @param {number} [startAt] - iterate forward to last interaction
     */
    async getInteractions (senderId, pageId, limit = 10, endAt = null, startAt = null) {
        const c = await this._getCollection();

        const q = {
            senderId,
            pageId
        };

        const orderBackwards = startAt && !endAt;

        if (startAt || endAt) {
            Object.assign(q, { timestamp: {} });
        }

        if (startAt) {
            Object.assign(q.timestamp, { $gte: startAt });
        }

        if (endAt) {
            Object.assign(q.timestamp, { $lte: endAt });
        }

        const res = await c.find(q)
            .limit(limit)
            .sort({ timestamp: orderBackwards ? 1 : -1 })
            .project({ _id: 0, time: 0 })
            .toArray();

        if (!orderBackwards) {
            res.reverse();
        }

        return res;
    }

    /**
     * Log single event
     *
     * @param {string} senderId
     * @param {object[]} responses - list of sent responses
     * @param {object} request - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    log (senderId, responses = [], request = {}, metadata = {}) {
        const log = {
            senderId,
            time: new Date(request.timestamp || Date.now()),
            request,
            responses
        };

        Object.assign(log, metadata);

        return this._getCollection()
            .then((c) => c.insertOne(log))
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
     * @param {object[]} [responses] - list of sent responses
     * @param {object} [request] - event request
     * @param {object} [metadata] - request metadata
     * @returns {Promise}
     */
    error (err, senderId, responses = [], request = {}, metadata = {}) {
        const log = {
            senderId,
            time: new Date(request.timestamp || Date.now()),
            request,
            responses,
            err: `${err}`
        };

        Object.assign(log, metadata);

        return this._getCollection()
            .then((c) => c.insertOne(log))
            .catch((storeError) => {
                this._log.error('Failed to store chat log', storeError, log);

                if (!this.muteErrors) {
                    throw storeError;
                }
            });
    }

}

module.exports = ChatLogStorage;
