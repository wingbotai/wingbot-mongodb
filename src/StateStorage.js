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
        super(mongoDb, collectionName, log, isCosmo);

        this.addIndex(
            { senderId: 1, pageId: 1 },
            { name: USER_INDEX, unique: true }
        );
        this.addIndex(
            { lastInteraction: isCosmo ? 1 : -1 },
            { name: LAST_INTERACTION_INDEX }
        );

        this.logCollisionsAsErrors = false;

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
        const doc = await c.findOne({
            senderId, pageId
        }, {
            projection: { _id: 0 },
            ...(this._uniqueIndexFailed ? { sort: { lastInteraction: -1 } } : {})
        });
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

        const res = await this._catchNetworkIssues(() => c.findOneAndUpdate({
            senderId,
            pageId,
            lock: { $lt }
        }, {
            $setOnInsert,
            $set
        }, {
            upsert: true,
            ...(this._uniqueIndexFailed ? { sort: { lastInteraction: -1 } } : {}),
            returnDocument: 'after',
            projection: {
                _id: 0
            }
        }));

        if (this._uniqueIndexFailed && !res.value.lastInteraction) {
            // check if there was a locked state
            const existing = await c.find({
                senderId,
                pageId
            })
                .sort({ lastInteraction: -1 })
                .toArray();

            if (existing.length > 1) {

                // remove entries without lastInteraction
                const $in = existing
                    .filter((s) => !s.lastInteraction && (s.lock === now || s.lock < $lt))
                    .map((s) => s._id);

                const logLevel = this.logCollisionsAsErrors ? 'error' : 'log';
                this._log[logLevel]('StateStorage: unique index workaround DETECTED', {
                    v: res.value, existing, $in: $in.map((i) => i.toString())
                });

                if ($in.length > 0) {
                    await c.deleteMany({ _id: { $in } });
                }

                throw Object.assign(new Error('State was locked'), { code: 11000 });
            } else {
                this._log.log('StateStorage: unique index workaround OK', res.value);
            }
        }

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

        if (this._uniqueIndexFailed) {
            await c.findOneAndUpdate({
                senderId, pageId
            }, {
                $set: state
            }, {
                sort: { lastInteraction: -1 },
                upsert: true
            });
        } else {
            await c.updateOne({
                senderId, pageId
            }, {
                $set: state
            }, {
                upsert: true
            });
        }

        return state;
    }

}

module.exports = StateStorage;
