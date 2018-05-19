/*
 * @author David Menger
 */
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

const CONFIG_ID = 'config';

/**
 * Storage for wingbot.ai conversation config
 *
 * @class
 */
class BotConfigStorage {

    /**
     *
     * @param {mongodb.Db} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'botconfig') {
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
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    async invalidateConfig () {
        return this._getCollection()
            .deleteOne({ _id: CONFIG_ID });
    }

    /**
     * @returns {Promise<number>}
     */
    async getConfigTimestamp () {
        const res = await this._getCollection()
            .findOne({
                _id: CONFIG_ID
            }, {
                limit: 1,
                projection: { _id: 0, timestamp: 1 }
            });

        return res ? res.timestamp : 0;
    }

    /**
     * @template T
     * @param {T} newConfig
     * @returns {Promise<T>}
     */
    async updateConfig (newConfig) {
        Object.assign(newConfig, { timestamp: Date.now() });

        await this._getCollection()
            .replaceOne({ _id: CONFIG_ID }, newConfig, { upsert: true });

        return newConfig;
    }

    /**
     * @returns {Promise<Object|null>}
     */
    getConfig () {
        return this._getCollection()
            .findOne({ _id: CONFIG_ID }, { projection: { _id: 0 } });
    }

}

module.exports = BotConfigStorage;
