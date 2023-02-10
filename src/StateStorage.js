/*
* @author David Menger
*/
'use strict';

const BaseStorage = require('./BaseStorage');
const defaultLogger = require('./defaultLogger');

const USER_INDEX = 'senderId_1_pageId_1';
const LAST_INTERACTION_INDEX = 'lastInteraction_1';
const SEARCH = 'search-text';
const NAME = 'name_1';

/**
 * @typedef {object} State
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {object} state
 */

/**
 * @typedef {object} StateCondition
 * @prop {string} [search]
 */

/** @typedef {import('mongodb').Db} Db */

/**
 * Storage for chat states
 *
 * @class
 */
class StateStorage extends BaseStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean|number} isCosmo - boolean or number of failures in last 10min to kill app
     */
    constructor (mongoDb, collectionName = 'states', log = defaultLogger, isCosmo = false) {
        super(mongoDb, collectionName, log, typeof isCosmo === 'number' || isCosmo);

        this.addIndex(
            { senderId: 1, pageId: 1 },
            { name: USER_INDEX, unique: true }
        );
        this.addIndex(
            { lastInteraction: isCosmo ? 1 : -1 },
            { name: LAST_INTERACTION_INDEX }
        );

        this._failStack = [];

        this._failures = typeof isCosmo === 'number' ? isCosmo : 0;

        if (isCosmo) {
            this.addIndex(
                { name: 1 },
                { name: NAME }
            );
        } else {
            this.addIndex(
                { '$**': 'text' },
                { name: SEARCH }
            );
        }

        this.failuresIntervalMs = 600000; // 10 minutes

        this._killing = null;

        this.networkFailureErrorNames = [
            'MongoServerSelectionError',
            'MongoNetworkError',
            'MongoNetworkTimeoutError',
            'MongoTopologyClosedError'
        ];

        this.killer = () => setTimeout(() => {
            process.exit(1);
        }, 10000);
    }

    /**
     * Add custom indexing rule
     *
     * @param {object} index
     * @param {object} options
     * @param {string} options.name
     * @deprecated
     */
    addCustomIndex (index, options) {
        this.addIndex(index, options);
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<State|null>}
     */
    async getState (senderId, pageId) {
        const c = await this._getCollection();
        const doc = await c.findOne({ senderId, pageId }, { projection: { _id: 0 } });
        // @ts-ignore
        return doc;
    }

    /**
     * Load state from database and lock it to prevent another reads
     *
     * @param {string} senderId - sender identifier
     * @param {string} pageId - page identifier
     * @param {object} [defaultState] - default state of the conversation
     * @param {number} [timeout=300] - given default state
     * @returns {Promise<object>} - conversation state
     */
    async getOrCreateAndLock (senderId, pageId, defaultState = {}, timeout = 300) {
        let now = Date.now();
        try {
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
                returnDocument: 'after',
                projection: {
                    _id: 0
                }
            });

            return res.value;
        } catch (e) {
            if (this._failures !== 0
                && this.networkFailureErrorNames.includes(e.name)) {

                now = Date.now();
                this._failStack.push(now);

                if (this._failStack.length >= this._failures
                    && this._failStack.shift() > (now - this.failuresIntervalMs)
                    && this._killing === null) {

                    this._log.error(`StateStorage: KILLING APP DUE FREQUENT NETWORK ERRORS ${this._failStack.length}`, e);

                    // let it alive for following ten seconds to process all logs
                    this._killing = this.killer() || null;
                }
            }

            throw e;
        }

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
            if (this._isCosmo) {
                const $regex = `^${condition.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`;
                Object.assign(useCondition, {
                    $or: [
                        { senderId: { $regex } },
                        { name: { $regex } }
                    ]
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
            if (!this._isCosmo) {
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
            data: data.map((camp) => this._mapState(camp)),
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
     * @param {object} state - conversation state
     * @returns {Promise<object>}
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
