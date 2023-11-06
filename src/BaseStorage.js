/**
 * @author David Menger
 */
'use strict';

const { ObjectId } = require('mongodb');
const { strict: assert } = require('assert');
const crypto = require('crypto');
const defaultLogger = require('./defaultLogger');

/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */
/** @typedef {import('mongodb').CreateIndexesOptions} CreateIndexesOptions */

/**
 *
 * @param {any} obj
 * @param {boolean} nested
 * @param {string} [attr]
 * @param {object} [ret]
 * @returns {object}
 */
function getNestedObjects (obj, nested, attr = null, ret = {}) {
    if (typeof obj !== 'object' || !obj || nested === null || Array.isArray(obj)) {
        Object.assign(ret, { [attr]: obj === undefined ? null : obj });
    } else {
        Object.entries(obj)
            .forEach(([key, val]) => {
                getNestedObjects(val, nested || null, attr ? `${attr}.${key}` : key, ret);
            });
    }
    return ret;
}

/**
 *
 * @template T
 * @param {string} k
 * @param {T} v
 * @returns {T|null|string}
 */
function signReplacer (k, v) {
    if (v === undefined) {
        return null;
    }
    if (v instanceof Date) {
        return v.toISOString();
    }
    return v;
}

class BaseStorage {

    static netFailuresIntervalMs = 600000; // 10 minutes

    static netFailuresCount = 0;

    static _killing = null;

    static _failStack = [];

    static killer = () => setTimeout(() => {
        process.exit(1);
    }, 10000);

    static networkFailureErrorNames = [
        'MongoServerSelectionError',
        'MongoNetworkError',
        'MongoNetworkTimeoutError',
        'MongoTopologyClosedError'
    ];

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
    constructor (mongoDb, collectionName, log = defaultLogger, isCosmo = false) {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;
        this._isCosmo = typeof isCosmo === 'number' || isCosmo;
        this._log = log;

        /**
         * @type {Collection|Promise<Collection>}
         */
        this._collection = null;

        this._indexes = [];

        this.ignoredSignatureKeys = ['_id', 'sign'];
        this._secret = null;

        this.systemIndexes = ['_id_', '_id'];

        this._fixtures = [];

        this._uniqueIndexFailed = false;

        if (typeof isCosmo === 'number') {
            BaseStorage.netFailuresCount = isCosmo;
        }

        if (this._isCosmo && !process.argv.some((a) => a.endsWith('mocha'))) {
            process.nextTick(() => {
                const hasUniqueIndex = this._indexes.some((i) => i.options.unique);

                if (hasUniqueIndex) {
                    this._getCollection()
                        .catch((e) => log.error(`DB.${this._collectionName} index pre-heat FAILED`, e));
                }
            });
        }

        this._indexing = null;
        this._shouldIndexBeforeRead = null;
        this._shouldWaitForIndex = null;
    }

    /**
     *
     * @template T
     * @param {{():T}} fn
     * @returns {Promise<T>}
     */
    _catchNetworkIssues (fn) {
        return Promise.resolve(fn())
            .catch((e) => {
                this._detectNetworkIssueException(e);
                throw e;
            });
    }

    /**
     * @template {Error} T
     * @param {T} e
     * @returns {T}
     */
    _detectNetworkIssueException (e) {
        if (BaseStorage.netFailuresCount !== 0
            && BaseStorage.networkFailureErrorNames.includes(e.name)) {

            const now = Date.now();
            BaseStorage._failStack.push(now);

            if (BaseStorage._failStack.length >= BaseStorage.netFailuresCount
                && BaseStorage._failStack.shift() > (now - BaseStorage.netFailuresIntervalMs)
                && BaseStorage._killing === null) {

                this._log.error(`${this._collectionName}: KILLING APP DUE FREQUENT NETWORK ERRORS ${BaseStorage._failStack.length}`, e);

                // let it alive for following ten seconds to process all logs
                BaseStorage._killing = BaseStorage.killer() || null;
            }
        }
        return e;
    }

    preHeat () {
        return this._getCollection();
    }

    /**
     * Insert defalt document to DB
     *
     * @param  {...{ _id: string|number|ObjectId }} objects
     */
    addFixtureDoc (...objects) {
        this._fixtures.push(...objects);
    }

    /**
     * Add custom indexing rule
     *
     * @param {object} index
     * @param {CreateIndexesOptions} options
     */
    addIndex (index, options) {
        if (!options.name) {
            throw new Error('`name` is missing in index specification!');
        }
        this._indexes.push({
            index,
            options
        });
    }

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
    _id (id) {
        return ObjectId.isValid(id) && `${id}`.length === 24
            ? new ObjectId(id)
            : id;
    }

    /**
     *
     * @param {string|null} attr
     * @param {{[key: string]: any}} obj
     * @param {boolean} [nested]
     * @returns {{[key: string]: any}}
     */
    _expandObjectToSet (attr, obj, nested = false) {
        if (Object.keys(obj).length === 0) {
            return null;
        }
        return getNestedObjects(obj, nested, attr);
    }

    async _getOrCreateCollection (name) {
        const db = typeof this._mongoDb === 'function'
            ? await this._mongoDb()
            : this._mongoDb;

        let collection;

        if (this._isCosmo) {
            // @ts-ignore
            const collections = await db.collections();

            collection = collections
                .find((c) => c.collectionName === name);

            if (!collection) {
                try {
                    collection = await db.createCollection(name);
                } catch (e) {
                    collection = db.collection(name);
                }
            }

        } else {
            collection = db.collection(name);
        }

        this._shouldIndexBeforeRead = this._fixtures.length !== 0;
        this._shouldWaitForIndex = this._isCosmo
            || this._shouldIndexBeforeRead
            || this._indexes.some((i) => i.options.unique);

        this._indexing = this._ensureIndexes(this._indexes, collection)
            .then(() => {
                this._indexing = false;
            })
            .catch((e) => {
                this._collection = null;
                this._log.log(`DB.${this._collectionName} - init failed`, e);
                return e;
            });

        return collection;
    }

    /**
     * Returns the collection to operate with
     *
     * @protected
     * @param {boolean} [forRead]
     * @returns {Promise<Collection>}
     */
    async _getCollection (forRead = false) {
        if (this._collection === null) {
            let c;
            try {
                this._collection = this._getOrCreateCollection(this._collectionName);
                c = await this._collection;
                this._collection = c;
            } catch (e) {
                this._collection = null;
                this._detectNetworkIssueException(e);
                throw e;
            }
        }

        if (this._indexing
            && this._shouldWaitForIndex
            && (!forRead || this._shouldIndexBeforeRead)) {

            const err = await this._indexing;
            this._indexing = false;
            if (err) throw err;
        }

        return this._collection;
    }

    /**
     *
     * @param {object[]} indexes
     * @param {Collection} collection
     * @returns {Promise}
     */
    async _ensureIndexes (indexes, collection) {
        const [existing, fixtures] = await Promise.all([
            this._checkExistingIndexes(collection),
            this._checkFixtures(collection)
        ]);

        await existing
            .filter((e) => !this.systemIndexes.includes(e.name)
                && !indexes.some((i) => e.name === i.options.name))
            .reduce((p, e) => {
                this._log.log(`DB.${this._collectionName} dropping index ${e.name}`);
                return p
                    .then(() => collection.dropIndex(e.name))
                    .catch((err) => {
                        this._log.error(`DB.${this._collectionName} dropping index ${e.name} FAILED`, err);
                    });
            }, Promise.resolve());

        await indexes
            .filter((i) => !existing.some((e) => e.name === i.options.name))
            .reduce((p, i) => {
                this._log.log(`DB.${this._collectionName} creating index ${i.options.name}`);
                return p
                    .then(() => collection.createIndex(i.index, i.options))
                    .catch((e) => {
                        if (i.options.unique) {
                            this._uniqueIndexFailed = true;
                        }
                        this._log.error(`DB.${this._collectionName} failed to create index ${i.options.name} on ${collection.collectionName}`, e);
                    })
                    .then(() => true);
            }, Promise.resolve(false));

        if (fixtures.length === 0) {
            return;
        }

        await fixtures.reduce(
            (p, o) => p
                .then(() => collection.insertOne(o))
                .then(() => this._log.log(`DB.${this._collectionName} Inserted fixture doc to "${this._collectionName}"`))
                .catch((e) => {
                    if (e.code === 11000) {
                        this._log.log(`DB.${this._collectionName} fixture not inserted: ${e.message}`);
                    } else {
                        this._log.error(`DB.${this._collectionName} failed to insert fixture doc to "${this._collectionName}"`, e);
                    }
                }),
            Promise.resolve()
        );
    }

    async _checkExistingIndexes (collection) {
        let existing;
        try {
            existing = await collection.indexes();
        } catch (e) {
            existing = [];
        }
        return existing;
    }

    async _checkFixtures (collection) {
        if (this._fixtures.length === 0) {
            return this._fixtures;
        }

        const fixtures = this._fixtures
            .map((f) => {
                assert(f._id, `DB.${this._collectionName} fixture must have _id property`);
                return {
                    ...f,
                    _id: this._id(f._id)
                };
            });

        const $in = fixtures.map((f) => f._id);

        const found = await collection
            .find({ _id: { $in } })
            .project({ _id: 1 })
            .map((doc) => doc._id.toString())
            .toArray();

        if (found.length === $in.length) {
            return [];
        }

        return fixtures.filter((f) => !found.includes(f._id.toString()));
    }

    /**
     *
     * @template T
     * @protected
     * @param {T} object
     * @returns {Promise<T>}
     */
    async _sign (object) {
        if (!this._secret) {
            return object;
        }
        const secret = await Promise.resolve(this._secret);
        const objToSign = this._objectToSign(object);
        const sign = this._signWithSecret(objToSign, secret);

        return Object.assign(objToSign, {
            sign
        });
    }

    /**
     *
     * @protected
     * @template T
     * @param {T} object
     * @returns {T}
     */
    _objectToSign (object) {
        const entries = Object.keys(object)
            .filter((key) => !this.ignoredSignatureKeys.includes(key));

        entries.sort();

        const objectClone = typeof structuredClone === 'function'
            ? (val) => structuredClone(val)
            : (val) => JSON.parse(JSON.stringify(val, signReplacer));

        // @ts-ignore
        return entries.reduce((o, key) => {
            let val = object[key];
            if (val !== null && typeof val === 'object') {
                val = objectClone(val);
            }
            return Object.assign(o, { [key]: val });
        }, {});
    }

    /**
     *
     * @template T
     * @param {T} objToSign
     * @param {string} secret
     * @param {string} [previous]
     * @returns {string}
     */
    _signWithSecret (objToSign, secret, previous = null) {
        const h = crypto.createHmac('sha3-224', secret)
            .update(JSON.stringify(objToSign, signReplacer));

        if (previous) {
            h.update(previous);
        }

        return h.digest('base64');
    }

    /**
     * Drop collection
     *
     * @returns {Promise}
     */
    async drop () {
        const db = typeof this._mongoDb === 'function'
            ? await this._mongoDb()
            : this._mongoDb;

        await db.dropCollection(this._collectionName)
            .catch(() => {});

        this._collection = null;
        this._indexing = null;
        this._shouldIndexBeforeRead = null;
        this._shouldWaitForIndex = null;
    }
}

module.exports = BaseStorage;
