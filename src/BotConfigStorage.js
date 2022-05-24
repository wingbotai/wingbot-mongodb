/*
 * @author David Menger
 */
'use strict';

let apiAuthorizer = () => false;
try {
    // @ts-ignore
    ({ apiAuthorizer } = module.require('wingbot'));
} catch (e) {
    // noop
}

/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */

const CONFIG_ID = 'config';

/**
 * Storage for wingbot.ai conversation config
 *
 * @class
 */
class BotConfigStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'botconfig') {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;

        /**
         * @type {Collection}
         */
        this._collection = null;
    }

    /**
     * @returns {Promise<Collection>}
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
     * Returns botUpdate API for wingbot
     *
     * @param {Function} [onUpdate] - async update handler function
     * @param {Function|string[]} [acl] - acl configuration
     * @returns {{updateBot:Function}}
     */
    api (onUpdate = () => Promise.resolve(), acl) {
        const storage = this;
        return {
            async updateBot (args, ctx) {
                // @ts-ignore
                if (!apiAuthorizer(args, ctx, acl)) {
                    return null;
                }
                await storage.invalidateConfig();
                await onUpdate();
                return true;
            }
        };
    }

    /**
     * Invalidates current configuration
     *
     * @returns {Promise}
     */
    async invalidateConfig () {
        const c = await this._getCollection();

        // @ts-ignore
        return c.deleteOne({ _id: CONFIG_ID });
    }

    /**
     * @returns {Promise<number>}
     */
    async getConfigTimestamp () {
        const c = await this._getCollection();
        const res = await c.findOne({
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
     * @param {string} [id]
     * @returns {Promise<T>}
     */
    async updateConfig (newConfig, id = CONFIG_ID) {
        Object.assign(newConfig, { timestamp: Date.now() });

        await this.setConfig(id, newConfig);

        return newConfig;
    }

    /**
     *
     * @param {string} id
     * @param {object} newConfig
     */
    async setConfig (id, newConfig) {
        const c = await this._getCollection();

        await c.replaceOne({ _id: id }, newConfig, { upsert: true });
    }

    /**
     * @param {string} [id]
     * @returns {Promise<object | null>}
     */
    async getConfig (id = CONFIG_ID) {
        const c = await this._getCollection();

        return c.findOne({ _id: id }, { projection: { _id: 0 } });
    }

}

module.exports = BotConfigStorage;
