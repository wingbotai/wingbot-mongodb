/**
 * @author David Menger
 */
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

/** @typedef {import('mongodb').IndexOptions} IndexOptions */

class BaseStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} isCosmo
     * @example
     *
     * const { BaseStorage } = require('winbot-mongodb');
     *
     * class MyCoolDataStorage extends BaseStorage {
     *
     *     constructor (mongoDb, collectionName = 'myCoolData', log = console, isCosmo = false) {
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
    constructor (mongoDb, collectionName, log = console, isCosmo = false) {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;
        this._isCosmo = isCosmo;
        this._log = log;

        /**
         * @type {Promise<mongodb.Collection>}
         */
        this._collection = null;

        this._indexes = [];
    }

    /**
     * Add custom indexing rule
     *
     * @param {object} index
     * @param {IndexOptions} options
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

    async _getOrCreateCollection (name) {
        const db = typeof this._mongoDb === 'function'
            ? await this._mongoDb()
            : this._mongoDb;

        let collection;

        if (this._isCosmo) {
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
     * @returns {Promise<mongodb.Collection>}
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

        await Promise.all(existing
            .filter((e) => !['_id_', '_id'].includes(e.name)
                && !indexes.some((i) => e.name === i.options.name))
            .map((e) => {
                // eslint-disable-next-line no-console
                this._log.log(`dropping index ${e.name}`);
                return collection.dropIndex(e.name)
                    .catch((err) => {
                        // eslint-disable-next-line no-console
                        this._log.error(`dropping index ${e.name} FAILED`, err);
                    });
            }));

        await Promise.all(indexes
            .filter((i) => !existing.some((e) => e.name === i.options.name))
            .map((i) => collection
                .createIndex(i.index, i.options)
                // @ts-ignore
                .catch((e) => {
                    this._log.error(`failed to create index ${i.options.name} on ${collection.collectionName}`, e);
                })));
    }

}

module.exports = BaseStorage;
