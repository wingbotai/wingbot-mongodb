/*
* @author David Menger
*/
'use strict';

const BaseStorage = require('./BaseStorage');
const defaultLogger = require('./defaultLogger');

const PAGE_SENDER_TIMESTAMP = 'pageId_1_senderId_1_timestamp_-1';
const TIMESTAMP = 'timestamp_1';
const SENDER = 'senderId_1';

/** @typedef {import('mongodb').Db} Db */

/**
 * Storage for conversation logs
 *
 * @class
 */
class ChatLogStorage extends BaseStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} [isCosmo]
     * @param {string|Promise<string>} [secret]
     */
    constructor (mongoDb, collectionName = 'chatlogs', log = defaultLogger, isCosmo = false, secret = null) {
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

            this.addIndex({
                senderId: 1
            }, {
                name: SENDER
            });
        }

        this.muteErrors = true;
        this._secret = secret;
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
     * @returns {Promise<object[]>}
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
            .project({ _id: 0 })
            .toArray();

        if (!orderBackwards) {
            res.reverse();
        }

        if (!this._secret) {
            return res.map((r) => Object.assign(r, { ok: null }));
        }

        const secret = await Promise.resolve(this._secret);

        return res.map((r) => {
            const {
                sign,
                ...log
            } = r;
            const objToSign = this._objectToSign(log);
            const compare = this._signWithSecret(objToSign, secret);
            const ok = compare === sign;
            if (!ok) {
                this._log.error(`ChatLog: found wrong signature at pageId: "${r.pageId}", senderId: "${r.senderId}", at: ${r.timestamp}`, r);
            }

            return Object.assign(log, { ok });
        });
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
            request,
            responses,
            ...metadata
        };

        return this._storeLog(log);
    }

    async _storeLog (event) {
        let log = event;
        if (!event.timestamp) {
            Object.assign(event, {
                timestamp: event.request.timestamp || Date.now()
            });
        }
        if (typeof event.pageId === 'undefined') {
            Object.assign(event, {
                pageId: null
            });
        }
        try {
            const c = await this._getCollection();
            log = await this._sign(log);
            // @ts-ignore
            await c.insertOne(log);
        } catch (e) {
            this._log.error('Failed to store chat log', e, log);

            if (!this.muteErrors) {
                throw e;
            }
        }
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
            request,
            responses,
            err: `${err}`,
            ...metadata
        };

        Object.assign(log, metadata);

        return this._storeLog(log);
    }

}

module.exports = ChatLogStorage;
