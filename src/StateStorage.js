/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars

const USER_INDEX = 'senderId_1_pageId_1';
const LAST_INTERACTION_INDEX = 'lastInteraction_1';
const SEARCH = 'search-text';

/**
 * @typedef {Object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {Object} state
 */

/**
 * @typedef {Object} StateCondition
 * @prop {string} [search]
 */

/**
 * Storage for chat states
 *
 * @class
 */
class StateStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} isCosmo
     */
    constructor (mongoDb, collectionName = 'states', log = console, isCosmo = false) {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;
        this._isCosmo = isCosmo;
        this._log = log;

        /**
         * @type {Promise<mongodb.Collection>}
         */
        this._collection = null;
        this._doesNotSupportTextIndex = isCosmo;

        this._customIndexes = [];
    }

    /**
     * Add custom indexing rule
     *
     * @param {Object} index
     * @param {Object} options
     * @param {string} options.name
     */
    addCustomIndex (index, options) {
        this._customIndexes.push({
            index,
            options
        });
    }

    _getIndexes () {
        const indexes = [
            {
                index: { senderId: 1, pageId: 1 },
                options: { name: USER_INDEX, unique: true, dropDups: true }
            },
            {
                index: { lastInteraction: this._isCosmo ? 1 : -1 },
                options: { name: LAST_INTERACTION_INDEX }
            }
        ];

        if (!this._doesNotSupportTextIndex) {
            indexes.push({
                // @ts-ignore
                index: { '$**': 'text' },
                options: { name: SEARCH },
                isTextIndex: true
            });
        }

        return [...indexes, ...this._customIndexes];
    }

    async _getOrCreateCollection (name) {
        const db = typeof this._mongoDb === 'function'
            ? await this._mongoDb()
            : this._mongoDb;

        let collection;

        if (this._isCosmo) {
            const collections = await db.collections();

            collection = collections
                .find(c => c.collectionName === name);

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
        return collection;
    }

    /**
     * @returns {Promise<mongodb.Collection>}
     */
    async _getCollection () {
        if (this._collection === null) {
            let c;
            try {
                this._collection = this._getOrCreateCollection(this._collectionName);
                c = await this._collection;
            } catch (e) {
                this._collection = null;
                throw e;
            }

            const indexes = this._getIndexes();

            await this._ensureIndexes(indexes, c);
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
            .filter(e => !['_id_', '_id'].includes(e.name) && !indexes.some(i => e.name === i.options.name))
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
            .filter(i => !existing.some(e => e.name === i.options.name))
            .map(i => collection
                .createIndex(i.index, i.options)
                // @ts-ignore
                .catch((e) => {
                    if (i.isTextIndex) {
                        this._doesNotSupportTextIndex = true;
                    } else {
                        this._log.error(`failed to create index ${i.options.name} on ${collection.collectionName}`);
                        throw e;
                    }
                })));
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    async getState (senderId, pageId) {
        const c = await this._getCollection();
        return c.findOne({ senderId, pageId }, { projection: { _id: 0 } });
    }

    /**
     * Load state from database and lock it to prevent another reads
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page identifier
     * @param {Object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<Object>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, timeout = 300) {
        const now = Date.now();

        const c = await this._getCollection();

        const $setOnInsert = {
            state: defaultState,
            lastSendError: null,
            off: false
        };

        const $set = {
            lock: now
        };

        const $lt = now - timeout;

        const res = await c.findOneAndUpdate({
            senderId,
            pageId,
            lock: { $lt }
        }, {
            $setOnInsert,
            $set
        }, {
            upsert: true,
            returnOriginal: false,
            projection: {
                _id: 0
            }
        });

        return res.value;
    }

    /**
     *
     * @param {StateCondition} condition
     * @param {number} limit
     * @param {string} lastKey
     * @returns {Promise<{data:State[],lastKey:string}>}
     */
    async getStates (condition = {}, limit = 20, lastKey = null) {
        const c = await this._getCollection();

        let cursor;
        const useCondition = {};
        let skip = 0;

        if (lastKey !== null) {
            const key = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));

            if (key.skip) {
                ({ skip } = key);
            } else {
                Object.assign(useCondition, {
                    lastInteraction: {
                        $lte: new Date(key.lastInteraction)
                    }
                });
            }
        }

        const searchStates = typeof condition.search === 'string';

        if (searchStates) {
            if (this._doesNotSupportTextIndex) {
                Object.assign(useCondition, {
                    name: { $regex: condition.search, $options: 'i' }
                });
            } else {
                Object.assign(useCondition, {
                    $text: { $search: condition.search }
                });
            }
            cursor = c
                .find(useCondition)
                .limit(limit + 1)
                .skip(skip);
            if (!this._doesNotSupportTextIndex) {
                cursor
                    .project({ score: { $meta: 'textScore' } })
                    .sort({ score: { $meta: 'textScore' } });
            }
        } else {
            cursor = c
                .find(useCondition)
                .limit(limit + 1)
                .sort({ lastInteraction: -1 });
        }

        let data = await cursor.toArray();

        let nextLastKey = null;
        if (limit !== null && data.length > limit) {
            if (searchStates) {
                nextLastKey = Buffer.from(JSON.stringify({
                    skip: skip + limit
                })).toString('base64');
            } else {
                const last = data[data.length - 1];
                nextLastKey = Buffer.from(JSON.stringify({
                    lastInteraction: last.lastInteraction ? last.lastInteraction.getTime() : 0
                })).toString('base64');
            }

            data = data.slice(0, limit);
        }

        return {
            data: data.map(camp => this._mapState(camp)),
            lastKey: nextLastKey
        };
    }

    _mapState (state) {
        if (!state) {
            return null;
        }

        delete state._id; // eslint-disable-line
        delete state.lock; // eslint-disable-line
        delete state.off; // eslint-disable-line
        delete state.lastSendError // eslint-disable-line
        delete state.score // eslint-disable-line

        return state;
    }

    /**
     * Save the state to database
     *
     * @param {Object} state - conversation state
     * @returns {Promise<Object>}
     */
    async saveState (state) {
        Object.assign(state, {
            lock: 0
        });

        const c = await this._getCollection();

        const { senderId, pageId } = state;

        await c.updateOne({
            senderId, pageId
        }, {
            $set: state
        }, {
            upsert: true
        });

        return state;
    }

}

module.exports = StateStorage;
