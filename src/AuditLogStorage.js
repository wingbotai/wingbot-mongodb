/**
 * @author wingbot.ai
 */
'use strict';

const jsonwebtoken = require('jsonwebtoken');
const BaseStorage = require('./BaseStorage');
const defaultLogger = require('./defaultLogger');

const LEVEL_CRITICAL = 'Critical';
const LEVEL_IMPORTANT = 'Important';
const LEVEL_DEBUG = 'Debug';

const TYPE_ERROR = 'Error';
const TYPE_WARN = 'Warn';
const TYPE_INFO = 'Info';

/**
 * @typedef {object} TrackingEvent
 * @prop {string} [type='audit']
 * @prop {string} category
 * @prop {string} action
 * @prop {string} [label]
 * @prop {object} [payload]
 */

/**
 * @typedef {object} User
 * @prop {string} [id]
 * @prop {string} [senderId]
 * @prop {string} [pageId]
 * @prop {string} [jwt] - jwt to check the authorship
 */

/**
 * @typedef {object} Meta
 * @prop {string} [ip]
 * @prop {string} [ua]
 * @prop {string} [ro] - referrer || origin
 */

/**
 * @typedef {object} LogEntry
 * @prop {string} date - ISO date
 * @prop {number} delta - time skew in ms if there was a write conflict
 * @prop {string} [eventType='audit']
 * @prop {string} category
 * @prop {string} action
 * @prop {string} [label]
 * @prop {object} [payload]
 * @prop {string} level - (Critical|Important|Debug)
 * @prop {boolean} ok - signature matches
 * @prop {number} seq - sequence number
 * @prop {string} type - (Error|Warn|Info)
 * @prop {User} user
 * @prop {string} wid - workspace id
 * @prop {Meta} meta
 */

/**
 * JWT Verifier
 *
 * @callback JwtVerifier
 * @param {string} token
 * @param {string} userId
 * @param {User} [user]
 * @returns {Promise<boolean>}
 */

/**
 * @typedef {object} AuditLogEntry
 * @prop {string} date - ISO date
 * @prop {string} [eventType='audit']
 * @prop {string} category
 * @prop {string} action
 * @prop {string} [label]
 * @prop {object} [payload]
 * @prop {string} level - (Critical|Important|Debug)
 * @prop {string} type - (Error|Warn|Info)
 * @prop {User} user
 * @prop {string} wid - workspace id
 * @prop {Meta} meta
 */

/**
 * Audit Log Callback
 *
 * @callback AuditLogCallback
 * @param {AuditLogEntry} entry
 * @returns {Promise}
 */

/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */

/**
 * Storage for audit logs with signatures chain
 */
class AuditLogStorage extends BaseStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} [isCosmo]
     * @param {string|Promise<string>} [secret]
     * @param {string|Promise<string>} [jwtVerifier]
     */
    constructor (mongoDb, collectionName = 'auditlog', log = defaultLogger, isCosmo = false, secret = null, jwtVerifier = null) {
        super(mongoDb, collectionName, log, isCosmo);

        this.addIndex({
            wid: 1,
            seq: -1
        }, {
            unique: true,
            name: 'wid_1_seq_-1'
        });

        if (isCosmo) {
            this.addIndex({
                wid: 1
            }, {
                name: 'wid_1'
            });

            this.addIndex({
                seq: -1
            }, {
                name: 'seq_-1'
            });
        } else {
            this.addIndex({
                wid: 1, date: -1
            }, {
                name: 'wid_1_date_-1'
            });
        }

        this.defaultWid = '0';

        this.muteErrors = true;
        this.maxRetries = 4;
        this._secret = secret;

        this.LEVEL_CRITICAL = LEVEL_CRITICAL;
        this.LEVEL_IMPORTANT = LEVEL_IMPORTANT;
        this.LEVEL_DEBUG = LEVEL_DEBUG;

        this.TYPE_ERROR = TYPE_ERROR;
        this.TYPE_WARN = TYPE_WARN;
        this.TYPE_INFO = TYPE_INFO;

        /**
         * @type {JwtVerifier}
         */
        // @ts-ignore
        this._jwtVerify = typeof jwtVerifier === 'function' || jwtVerifier === null
            ? jwtVerifier
            : async (token, userId) => {
                const jwtSec = await Promise.resolve(jwtVerifier);
                const decoded = await new Promise((resolve) => {
                    jsonwebtoken.verify(token, jwtSec, (err, res) => {
                        resolve(res || {});
                    });
                });
                return decoded.id === userId;
            };

        /** @type {AuditLogCallback} */
        this.callback = null;
    }

    /**
     * Add a log
     *
     * @param {TrackingEvent} event
     * @param {User} user
     * @param {Meta} [meta]
     * @param {string} [wid] - workspace ID
     * @param {string} [type]
     * @param {string} [level]
     * @param {Date} [date]
     * @returns {Promise}
     */
    async log (
        event,
        user = {},
        meta = {},
        wid = this.defaultWid,
        type = TYPE_INFO,
        level = LEVEL_IMPORTANT,
        date = new Date()
    ) {
        const {
            type: eventType = 'audit',
            ...rest
        } = event;
        const entry = {
            date,
            eventType,
            ...rest,
            level,
            meta,
            type,
            user,
            wid
        };

        const secret = await Promise.resolve(this._secret);
        const stored = await this._storeWithRetry(secret, entry);
        if (!this.callback) {
            return;
        }
        try {
            await this.callback(stored);
        } catch (e) {
            this._log.error('Failed to send AuditLog', e, entry);
        }

        // logEvent(level, type, workflowType, workflowInstance, eventData, account)
        // level is the criticality of the event ('Critical','Important','Debug').
        // type is the type of the event ('Error','Warn','Info').
        /**
         *  - log (N/A)
            - report (Debug)
            - conversation (N/A)
            - audit (Important)
            - user (N/A)
         */
    }

    /**
     *
     * @param {string} [wid] - workspace id
     * @param {number} [fromSeq] - for paging
     * @param {number} [limit]
     * @returns {Promise<LogEntry[]>}
     */
    async list (wid = this.defaultWid, fromSeq = 0, limit = 40) {
        const c = await this._getCollection();

        const cond = { wid };

        if (fromSeq) {
            cond.seq = { $lt: fromSeq };
        }

        const data = await c.find({ wid })
            .limit(limit + 1)
            .sort({ seq: -1 })
            .project({ _id: 0 })
            .toArray();

        const secret = await Promise.resolve(this._secret);

        const len = data.length === limit + 1
            ? data.length - 1
            : data.length;
        const ret = new Array(len);

        let verifyUser = false;
        for (let i = 0; i < len; i++) {
            const {
                sign,
                ...log
            } = data[i];

            verifyUser = verifyUser || (log.user.id && log.user.jwt);

            if (secret) {
                const previous = data[i + 1] || { sign: null };
                const objToSign = this._objectToSign(log);
                const compare = this._signWithSecret(objToSign, secret, previous.sign);
                log.ok = compare === sign;
                if (!log.ok) {
                    this._log.error(`AuditLog: found wrong signature at wid: "${log.wid}", seq: "${log.seq}"`, log);
                }
            } else {
                log.ok = null;
            }

            ret[i] = log;
        }

        if (verifyUser && this._jwtVerify) {
            return Promise.all(
                ret.map(async (log) => {
                    if (!log.user.id || !log.user.jwt) {
                        return log;
                    }
                    const userChecked = await this._jwtVerify(log.user.jwt, log.user.id, log.user);
                    return Object.assign(log, {
                        // it's ok, when there was null
                        ok: log.ok !== false && userChecked
                    });
                })
            );
        }

        return ret;
    }

    _wait (ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    async _storeWithRetry (secret, entry, delta = 0, i = 1) {
        const start = Date.now();
        Object.assign(entry, { delta });
        try {
            await this._store(entry, secret);
            return entry;
        } catch (e) {
            if (e.code === 11000) {
                // duplicate key
                if (i >= this.maxRetries) {
                    throw new Error('AuditLog: cannot store log due to max-retries');
                } else {
                    await this._wait((i * 50) + (Math.random() * 100));
                    const add = Date.now() - start;
                    return this._storeWithRetry(secret, entry, delta + add, i + 1);
                }
            } else if (this.muteErrors) {
                this._log.error('Audit log store error', e, entry);
                return entry;
            } else {
                throw e;
            }
        }
    }

    async _store (entry, secret) {
        const c = await this._getCollection();

        const previous = await c.findOne({
            wid: entry.wid
        }, {
            sort: { seq: -1 },
            projection: { seq: 1, _id: 0, sign: 1 }
        });

        Object.assign(entry, {
            seq: previous ? previous.seq + 1 : 0
        });

        let insert;
        if (secret) {
            insert = this._objectToSign(entry);
            const sign = this._signWithSecret(insert, secret, previous ? previous.sign : null);
            Object.assign(insert, { sign });
        } else {
            insert = {
                ...entry,
                sign: null
            };
        }

        // @ts-ignore
        await c.insertOne(insert);
    }

}

module.exports = AuditLogStorage;
