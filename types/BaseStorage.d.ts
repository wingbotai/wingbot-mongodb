export = BaseStorage;
/**
 * @template T={} {Document}
 */
declare class BaseStorage<T> {
    static netFailuresIntervalMs: number;
    static netFailuresCount: number;
    static _killing: any;
    static _failStack: any[];
    static killer: () => NodeJS.Timeout;
    static networkFailureErrorNames: string[];
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean|number} [isCosmo]
     * @example
     *
     * const { BaseStorage } = require('winbot-mongodb');
     *
     * class MyCoolDataStorage extends BaseStorage {
     *
     *     constructor (mongoDb, collectionName, log = undefined, isCosmo = false) {
     *          super(mongoDb, collectionName, log, isCosmo);
     *
     *          this.addIndex({
     *              foo: -1
     *          }, {
     *              name: 'foo_1'
     *          });
     *
     *          this.addIndex({
     *              bar: -1,
     *              baz: 1
     *          }, {
     *              name: 'bar_-1_baz_1'
     *          });
     *     }
     *
     * }
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName: string, log?: {
        error: Function;
        log: Function;
    }, isCosmo?: boolean | number);
    _mongoDb: import("mongodb").Db | (() => Promise<Db>);
    _collectionName: string;
    _isCosmo: boolean;
    _log: {
        error: Function;
        log: Function;
    };
    /** @type {import('mongodb').Collection<WithId<T>>|Promise<import('mongodb').Collection<WithId<T>>>} */
    _collection: import("mongodb").Collection<WithId<T>> | Promise<import("mongodb").Collection<WithId<T>>>;
    _indexes: any[];
    ignoredSignatureKeys: string[];
    _secret: any;
    systemIndexes: string[];
    _fixtures: any[];
    _uniqueIndexFailed: boolean;
    _indexing: any;
    _shouldIndexBeforeRead: boolean;
    _shouldWaitForIndex: boolean;
    /**
     *
     * @template T
     * @param {{():T}} fn
     * @returns {Promise<T>}
     */
    _catchNetworkIssues<T_1>(fn: {
        (): T_1;
    }): Promise<T_1>;
    /**
     * @template {Error} T
     * @param {T} e
     * @returns {T}
     */
    _detectNetworkIssueException<T_1 extends Error>(e: T_1): T_1;
    /**
     *
     * @returns {Promise<import('mongodb').Collection<WithId<T>>>}
     */
    preHeat(): Promise<import("mongodb").Collection<WithId<T>>>;
    /**
     * Insert defalt document to DB
     *
     * @param  {...WithId<T>} objects
     */
    addFixtureDoc(...objects: WithId<T>[]): void;
    /**
     * Add custom indexing rule
     *
     * @param {object} index
     * @param {CreateIndexesOptions} options
     */
    addIndex(index: object, options: CreateIndexesOptions): void;
    /**
     * @example
     * {
     *   _id: ObjectId.isValid(id) ? new ObjectId(input) : input
     * }
     *
     * @protected
     * @param {string} id
     * @returns {string|ObjectId}
     */
    protected _id(id: string): string | ObjectId;
    /**
     *
     * @param {string|null} attr
     * @param {{[key: string]: any}} obj
     * @param {boolean} [nested]
     * @returns {{[key: string]: any}}
     */
    _expandObjectToSet(attr: string | null, obj: {
        [key: string]: any;
    }, nested?: boolean): {
        [key: string]: any;
    };
    /**
     *
     * @param {string} name
     * @returns {Promise<import('mongodb').Collection<WithId<T>>>}
     */
    _getOrCreateCollection(name: string): Promise<import("mongodb").Collection<WithId<T>>>;
    /**
     * Returns the collection to operate with
     *
     * @protected
     * @param {boolean} [forRead]
     * @param {boolean} [forceIndexAwait=false]
     * @returns {Promise<import('mongodb').Collection<WithId<T>>>}
     */
    protected _getCollection(forRead?: boolean, forceIndexAwait?: boolean): Promise<import("mongodb").Collection<WithId<T>>>;
    /**
     *
     * @param {object[]} indexes
     * @param {import('mongodb').Collection<WithId<T>>} collection
     * @returns {Promise}
     */
    _ensureIndexes(indexes: object[], collection: import("mongodb").Collection<WithId<T>>): Promise<any>;
    _checkExistingIndexes(collection: any): Promise<any>;
    _checkFixtures(collection: any): Promise<any[]>;
    /**
     *
     * @template T
     * @protected
     * @param {T} object
     * @returns {Promise<T>}
     */
    protected _sign<T_1>(object: T_1): Promise<T_1>;
    /**
     *
     * @protected
     * @template T
     * @param {T} object
     * @returns {T}
     */
    protected _objectToSign<T_1>(object: T_1): T_1;
    /**
     *
     * @template T
     * @param {T} objToSign
     * @param {string} secret
     * @param {string} [previous]
     * @returns {string}
     */
    _signWithSecret<T_1>(objToSign: T_1, secret: string, previous?: string): string;
    /**
     * Drop collection
     *
     * @returns {Promise}
     */
    drop(): Promise<any>;
}
declare namespace BaseStorage {
    export { Db, Document, CreateIndexesOptions, CustomIdentifier, WithId };
}
import { ObjectId } from "mongodb";
type Db = import("mongodb").Db;
type Document = import("mongodb").Document;
type CreateIndexesOptions = import("mongodb").CreateIndexesOptions;
type CustomIdentifier<T> = {
    _id: T;
};
type WithId<T extends unknown> = T & CustomIdentifier<ObjectId>;
