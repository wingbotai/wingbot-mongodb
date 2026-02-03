export = AuditLogStorage;
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
declare class AuditLogStorage extends BaseStorage<any> {
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} [isCosmo]
     * @param {string|Promise<string>} [secret]
     * @param {string|Promise<string>} [jwtVerifier]
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName?: string, log?: {
        error: Function;
        log: Function;
    }, isCosmo?: boolean, secret?: string | Promise<string>, jwtVerifier?: string | Promise<string>);
    defaultWid: string;
    muteErrors: boolean;
    maxRetries: number;
    _secret: string | Promise<string>;
    LEVEL_CRITICAL: string;
    LEVEL_IMPORTANT: string;
    LEVEL_DEBUG: string;
    TYPE_ERROR: string;
    TYPE_WARN: string;
    TYPE_INFO: string;
    /**
     * @type {JwtVerifier}
     */
    _jwtVerify: JwtVerifier;
    /** @type {AuditLogCallback} */
    callback: AuditLogCallback;
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
    log(event: TrackingEvent, user?: User, meta?: Meta, wid?: string, type?: string, level?: string, date?: Date): Promise<any>;
    /**
     *
     * @param {string} [wid] - workspace id
     * @param {number} [fromSeq] - for paging
     * @param {number} [limit]
     * @returns {Promise<LogEntry[]>}
     */
    list(wid?: string, fromSeq?: number, limit?: number): Promise<LogEntry[]>;
    _wait(ms: any): Promise<any>;
    _storeWithRetry(secret: any, entry: any, delta?: number, i?: number): any;
    _store(entry: any, secret: any): Promise<void>;
}
declare namespace AuditLogStorage {
    export { TrackingEvent, User, Meta, LogEntry, JwtVerifier, AuditLogEntry, AuditLogCallback, Db, Collection };
}
import BaseStorage = require("./BaseStorage");
type TrackingEvent = {
    type?: string;
    category: string;
    action: string;
    label?: string;
    payload?: object;
};
type User = {
    id?: string;
    senderId?: string;
    pageId?: string;
    /**
     * - jwt to check the authorship
     */
    jwt?: string;
};
type Meta = {
    ip?: string;
    ua?: string;
    /**
     * - referrer || origin
     */
    ro?: string;
};
type LogEntry = {
    /**
     * - ISO date
     */
    date: string;
    /**
     * - time skew in ms if there was a write conflict
     */
    delta: number;
    eventType?: string;
    category: string;
    action: string;
    label?: string;
    payload?: object;
    /**
     * - (Critical|Important|Debug)
     */
    level: string;
    /**
     * - signature matches
     */
    ok: boolean;
    /**
     * - sequence number
     */
    seq: number;
    /**
     * - (Error|Warn|Info)
     */
    type: string;
    user: User;
    /**
     * - workspace id
     */
    wid: string;
    meta: Meta;
};
/**
 * JWT Verifier
 */
type JwtVerifier = (token: string, userId: string, user?: User) => Promise<boolean>;
type AuditLogEntry = {
    /**
     * - ISO date
     */
    date: string;
    eventType?: string;
    category: string;
    action: string;
    label?: string;
    payload?: object;
    /**
     * - (Critical|Important|Debug)
     */
    level: string;
    /**
     * - (Error|Warn|Info)
     */
    type: string;
    user: User;
    /**
     * - workspace id
     */
    wid: string;
    meta: Meta;
};
/**
 * Audit Log Callback
 */
type AuditLogCallback = (entry: AuditLogEntry) => Promise<any>;
type Db = import("mongodb").Db;
type Collection = import("mongodb").Collection;
