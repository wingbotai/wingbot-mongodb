/**
 * @author David Menger
 */
'use strict';

const { ObjectId } = require('mongodb');
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

class BaseStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} [isCosmo]
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
        this._isCosmo = isCosmo;
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

        if (isCosmo && !process.argv.some((a) => a.endsWith('mocha'))) {
            process.nextTick(() => {
                const hasUniqueIndex = this._indexes.some((i) => i.options.unique);

                if (hasUniqueIndex) {
                    this._getCollection()
                        .catch((e) => log.error(`DB.${this._collectionName} index pre-heat FAILED`, e));
                }
            });
        }
    }

    /**
     * Insert defalt document to DB
     *
     * @param  {...any} objects
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

        await this._ensureIndexes(this._indexes, collection);

        return collection;
    }

    /**
     * Returns the collection to operate with
     *
     * @protected
     * @returns {Promise<Collection>}
     */
    async _getCollection () {
        if (this._collection === null) {
            let c;
            try {
                this._collection = this._getOrCreateCollection(this._collectionName);
                c = await this._collection;
                this._collection = c;
            } catch (e) {
                this._collection = null;
                throw e;
            }
        }
        return this._collection;
    }

    async _ensureIndexes (indexes, collection) {
        let existing;
        try {
            existing = await collection.indexes();
        } catch (e) {
            existing = [];
        }

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

        const updated = await indexes
            .filter((i) => !existing.some((e) => e.name === i.options.name))
            .reduce((p, i) => {
                this._log.log(`DB.${this._collectionName} creating index ${i.options.name}`);
                return p
                    .then(() => collection.createIndex(i.index, i.options))
                    .catch((e) => {
                        this._log.error(`DB.${this._collectionName} failed to create index ${i.options.name} on ${collection.collectionName}`, e);
                    })
                    .then(() => true);
            }, Promise.resolve(false));

        if (updated || existing.every((i) => this.systemIndexes.includes(i.name))) {
            // upsert fixtures

            await this._fixtures.reduce((p, o) => p
                .then(() => collection.insertOne(o))
                .then(() => this._log.log(`DB.${this._collectionName} Inserted fixture doc to "${this._collectionName}"`))
                .catch((e) => {
                    if (e.code !== 11000) {
                        this._log.error(`DB.${this._collectionName} failed to insert fixture doc to "${this._collectionName}"`, e);
                    }
                }),
            Promise.resolve());
        }
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

        // @ts-ignore
        return entries.reduce((o, key) => {
            let val = object[key];
            if (val instanceof Date) {
                val = val.toISOString();
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
            .update(JSON.stringify(objToSign));

        if (previous) {
            h.update(previous);
        }

        return h.digest('base64');
    }
}

module.exports = BaseStorage;
