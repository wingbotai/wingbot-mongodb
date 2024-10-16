/**
 * @author David Menger
 */
'use strict';

const mongodb = require('mongodb');
const defaultLogger = require('./defaultLogger');

const { ObjectId } = mongodb;

/**
 * @typedef {object} Target
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {{ [key: string]: object }} [meta]
 */

/**
 * @typedef {object} Subscribtion
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {string[]} subs
 */

/**
 * @typedef {object}  Campaign
 * @prop {string} id
 * @prop {string} name
 *
 * Tatgeting
 *
 * @prop {string[]} include
 * @prop {string[]} exclude
 *
 * Stats
 *
 * @prop {number} sent
 * @prop {number} succeeded
 * @prop {number} failed
 * @prop {number} unsubscribed
 * @prop {number} delivery
 * @prop {number} read
 * @prop {number} notSent
 * @prop {number} leaved
 * @prop {number} queued
 *
 * Interaction
 *
 * @prop {string} action
 * @prop {object} [data]
 *
 * Setup
 *
 * @prop {boolean} sliding
 * @prop {number} slide
 * @prop {number} slideRound
 * @prop {boolean} active
 * @prop {boolean} in24hourWindow
 * @prop {number} startAt
 */

/**
 * @typedef {object} Task
 * @prop {string} id
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} campaignId
 * @prop {number} enqueue
 * @prop {number} [read]
 * @prop {number} [delivery]
 * @prop {number} [sent]
 * @prop {number} [insEnqueue]
 * @prop {boolean} [reaction] - user reacted
 * @prop {number} [leaved] - time the event was not sent because user left
 */

/**
 * @typedef {object} Subscription
 * @prop {string} tag
 * @prop {object} meta
 */

/**
 * @typedef {object} SubscriptionData
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string[]} tags
 * @prop {boolean} [remove]
 * @prop {{ [key: string]: object }} [meta]
 */

const MAX_TS = 9999999999999;
const COSMO_LIMIT = 999;

class NotificationsStorage {

    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionsPrefix
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} isCosmo
     */
    constructor (mongoDb, collectionsPrefix = '', log = defaultLogger, isCosmo = false) {
        this._mongoDb = mongoDb;

        this.taksCollection = `${collectionsPrefix}notification-tasks`;

        this.campaignsCollection = `${collectionsPrefix}notification-campaigns`;

        this.subscribtionsCollection = `${collectionsPrefix}notification-subscribtions`;

        this._isCosmo = isCosmo;
        this._log = log;

        /**
         * @type {Map<string,Promise<mongodb.Collection>>}
         */
        this._collections = new Map();

        if (isCosmo && !process.argv.some((a) => a.endsWith('mocha'))) {
            process.nextTick(() => {
                Promise.all([
                    this._getCollection(this.taksCollection),
                    this._getCollection(this.campaignsCollection),
                    this._getCollection(this.subscribtionsCollection)
                ])
                    .catch((e) => log.error('DB.<NotificationsStorage> index pre-heat FAILED', e));
            });
        }
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
        return collection;
    }

    /**
     * @param {string} collectionName
     * @returns {Promise<mongodb.Collection>}
     */
    async _getCollection (collectionName) {
        if (!this._collections.has(collectionName)) {
            let collection = this._getOrCreateCollection(collectionName);

            this._collections.set(collectionName, collection);
            try {
                // @ts-ignore
                collection = await collection;
            } catch (e) {
                this._collections.delete(collectionName);
                throw e;
            }

            // attach indexes
            switch (collectionName) {
                case this.taksCollection:
                    await this._ensureIndexes(collection, [
                        {
                            index: {
                                pageId: 1, senderId: 1, campaignId: 1, sent: -1
                            },
                            options: { unique: true, name: 'pageId_1_senderId_1_campaignId_1_sent_-1' }
                        }, {
                            index: { enqueue: 1 },
                            options: { name: 'enqueue_1' }
                        }, {
                            index: {
                                pageId: 1, senderId: 1, sent: -1, read: 1
                            },
                            options: { name: 'pageId_1_senderId_1_sent_-1_read_1' }
                        }, {
                            index: {
                                pageId: 1, senderId: 1, sent: -1, delivery: 1
                            },
                            options: { name: 'pageId_1_senderId_1_sent_-1_delivery_1' }
                        }, {
                            index: {
                                campaignId: 1, leaved: -1, reaction: -1
                            },
                            options: { name: 'campaignId_1_leaved_-1_reaction_-1' }
                        },
                        ...(this._isCosmo ? [
                            {
                                index: {
                                    sent: this._isCosmo ? 1 : -1
                                },
                                options: { name: 'sent_1' }
                            }
                        ] : [])
                    ]);
                    break;
                case this.subscribtionsCollection:
                    await this._ensureIndexes(collection, [
                        {
                            index: { pageId: 1, senderId: 1 },
                            options: { unique: true, name: 'pageId_1_senderId_1' }
                        }, {
                            index: { subs: 1, pageId: 1 },
                            options: { name: 'subs_1_pageId_1' }
                        }
                    ]);
                    break;
                case this.campaignsCollection:
                    await this._ensureIndexes(collection, [
                        {
                            index: { id: 1 },
                            options: { unique: true, name: 'id_1' }
                        }, {
                            index: { active: -1, startAt: -1 },
                            options: { name: 'active_-1_startAt_-1' }
                        }
                    ]);
                    break;
                default:
                    break;
            }
        }
        return this._collections.get(collectionName);
    }

    async _ensureIndexes (collection, indexes) {
        let existing;
        try {
            existing = await collection.indexes();
        } catch (e) {
            existing = [];
        }

        await Promise.all(existing
            .filter((e) => !['_id_', '_id'].includes(e.name) && !indexes.some((i) => e.name === i.options.name))
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
                    if (i.isTextIndex) {
                        this._doesNotSupportTextIndex = true;
                    } else {
                        this._log.error(`failed to create index ${i.options.name} on ${collection.collectionName}`, e);
                    }
                })));
    }

    /**
     *
     * @param {object} tasks
     * @returns {Promise<Task[]>}
     */
    async pushTasks (tasks) {

        // upsert through unique KEY (only single sliding campaign in queue)
        // [campaignId,senderId,pageId,sent]
        // maybe without unique key at dynamodb

        const c = await this._getCollection(this.taksCollection);

        const res = await c.bulkWrite(tasks.map((task) => {
            const {
                campaignId, senderId, pageId, sent
            } = task;

            const $set = { ...task };

            const filter = {
                campaignId, senderId, pageId, sent
            };

            delete $set.campaignId;
            delete $set.senderId;
            delete $set.pageId;
            delete $set.sent;

            return {
                updateOne: {
                    filter,
                    update: {
                        $set,
                        $inc: { ups: 1 },
                        $min: { insEnqueue: task.enqueue }
                    },
                    upsert: true
                }
            };
        }));

        const findMissingIds = tasks
            .reduce((arr, {
                campaignId, senderId, pageId, sent, enqueue
            }, i) => {
                if (typeof res.upsertedIds[i] !== 'undefined') {
                    return arr;
                }
                arr.push({
                    i,
                    enqueue,
                    filter: {
                        campaignId, senderId, pageId, sent
                    }
                });
                return arr;
            }, []);

        const missingIds = new Map();

        if (findMissingIds.length > 0) {
            await Promise.all(findMissingIds
                .map(({ filter, i, enqueue }) => c.findOne(filter, {
                    projection: {
                        _id: 1, insEnqueue: 1, enqueue: 1, ups: 1
                    }
                })
                    .then((found) => {
                        if (!found) { // race condition occurred
                            missingIds.set(i, {
                                id: null,
                                insEnqueue: -1,
                                enqueue
                            });
                        } else {
                            const id = typeof found._id === 'string'
                                ? found._id
                                : found._id.toHexString();
                            missingIds.set(i, {
                                id,
                                insEnqueue: found.insEnqueue,
                                enqueue: found.insEnqueue === found.enqueue
                                    && found.enqueue !== MAX_TS && found.ups !== 1
                                    ? found.enqueue + 1
                                    : found.enqueue
                            });
                        }
                    })));
        }

        return tasks.map((task, i) => {
            let override;
            if (typeof res.upsertedIds[i] !== 'undefined') {
                override = { id: res.upsertedIds[i].toHexString(), insEnqueue: task.enqueue };
            } else {
                override = missingIds.get(i);
            }
            return { ...task, ...override };
        });
    }

    _mapGenericObject (obj) {
        if (!obj) {
            return null;
        }

        const id = typeof obj._id === 'string'
            ? obj._id
            : obj._id.toHexString();

        delete obj._id; // eslint-disable-line no-param-reassign

        return Object.assign(obj, { id });
    }

    _mapCampaign (camp) {
        if (!camp) {
            return null;
        }

        delete camp._id; // eslint-disable-line

        return camp;
    }

    async popTasks (limit, until = Date.now()) {
        const c = await this._getCollection(this.taksCollection);
        const pop = [];

        let go = true;
        while (go) {
            const found = await c.findOneAndUpdate({
                enqueue: { $lte: until }
            }, {
                $set: {
                    enqueue: MAX_TS,
                    insEnqueue: MAX_TS,
                    ups: 0
                }
            }, {
                sort: { enqueue: 1 },
                returnDocument: 'after'
            });
            if (found) {
                pop.push(this._mapGenericObject(found));
                go = pop.length < limit;
            } else {
                go = false;
            }
        }

        return pop;
    }

    /**
     *
     * @param {string} campaignId
     * @param {boolean} [sentWithoutReaction]
     * @param {string} [pageId]
     */
    async getUnsuccessfulSubscribersByCampaign (
        campaignId,
        sentWithoutReaction = false,
        pageId = null
    ) {

        const c = await this._getCollection(this.taksCollection);

        const condition = { campaignId, leaved: null };

        if (pageId) Object.assign(condition, { pageId });
        if (sentWithoutReaction) {
            Object.assign(condition, { leaved: null, reaction: false });
        } else {
            Object.assign(condition, { leaved: { $gt: 0 } });
        }

        const data = [];

        let hasNext = true;
        let skip = 0;

        // this is because the cosmodb
        while (hasNext) {
            const res = await c.find(condition)
                .project({ _id: 0, senderId: 1, pageId: 1 })
                .limit(COSMO_LIMIT)
                .skip(skip)
                .toArray();

            data.push(...res);

            if (res.length === COSMO_LIMIT) {
                skip += COSMO_LIMIT;
            } else {
                hasNext = false;
            }
        }

        return data;
    }

    /**
     * Return Task By Id
     *
     * @param {string} taskId
     * @returns {Promise<Task|null>}
     */
    async getTaskById (taskId) {
        const c = await this._getCollection(this.taksCollection);

        const res = await c.findOne({
            // @ts-ignore
            _id: ObjectId.isValid(taskId)
                ? ObjectId.createFromHexString(taskId)
                : taskId
        });

        return this._mapGenericObject(res);
    }

    /**
     *
     * @param {string} taskId
     * @param {object} data
     */
    async updateTask (taskId, data) {
        const c = await this._getCollection(this.taksCollection);

        const res = await c.findOneAndUpdate({
            // @ts-ignore
            _id: ObjectId.isValid(taskId)
                ? ObjectId.createFromHexString(taskId)
                : taskId
        }, {
            $set: data
        }, {
            returnDocument: 'after'
        });

        return this._mapGenericObject(res);
    }

    /**
     * Get last sent task from campaign
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} campaignId
     * @returns {Promise<Task|null>}
     */
    async getSentTask (pageId, senderId, campaignId) {
        const c = await this._getCollection(this.taksCollection);

        const res = await c.findOne({
            pageId,
            senderId,
            campaignId,
            sent: { $gte: 1 }
        }, {
            sort: { sent: -1 }
        });

        return this._mapGenericObject(res);
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string[]} checkCampaignIds
     * @returns {Promise<string[]>}
     */
    async getSentCampagnIds (pageId, senderId, checkCampaignIds) {
        const c = await this._getCollection(this.taksCollection);

        const condition = {
            pageId,
            senderId,
            campaignId: { $in: checkCampaignIds },
            sent: { $gte: 1 }
        };

        try {
            const res = await c.distinct('campaignId', condition);
            return res;
        } catch (e) {
            const data = await c.find(condition)
                .project({ campaignId: 1, _id: 0 })
                .toArray();

            return data.map((d) => d.campaignId);
        }
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} watermark
     * @param {('read'|'delivery')} eventType
     * @param {number} ts
     * @returns {Promise<Task[]>}
     */
    async updateTasksByWatermark (senderId, pageId, watermark, eventType, ts = Date.now()) {
        const c = await this._getCollection(this.taksCollection);

        const tasks = await c
            .find({
                senderId, pageId, sent: { $lte: watermark }, [eventType]: null
            })
            .project({ _id: true })
            .toArray();

        if (tasks.length === 0) {
            return [];
        }

        const result = await Promise.all(
            tasks.map((task) => c.findOneAndUpdate({
                _id: task._id,
                [eventType]: null
            }, {
                $set: {
                    [eventType]: ts
                }
            }, {
                returnDocument: 'after'
            }))
        );

        return result
            .map((res) => (res ? this._mapGenericObject(res) : null))
            .filter((r) => r !== null);
    }

    /**
     *
     * @param {object} campaign
     * @param {object} [updateCampaign]
     * @returns {Promise<Campaign>}
     */
    async upsertCampaign (campaign, updateCampaign = null) {
        const c = await this._getCollection(this.campaignsCollection);

        let ret;
        if (campaign.id) {
            const $setOnInsert = { ...campaign };
            delete $setOnInsert.id;
            const update = {};
            if (Object.keys($setOnInsert).length !== 0) {
                Object.assign(update, {
                    $setOnInsert
                });
            }
            if (updateCampaign) {
                Object.assign(update, {
                    $set: updateCampaign
                });
            }
            const res = await c.findOneAndUpdate({
                id: campaign.id
            }, update, {
                upsert: true,
                returnDocument: 'after'
            });
            ret = this._mapCampaign(res);
        } else {
            const id = new ObjectId();
            ret = { id: id.toHexString(), _id: id, ...campaign };
            if (updateCampaign) {
                Object.assign(ret, updateCampaign);
            }
            await c.insertOne(ret);
            delete ret._id;
        }

        return ret;
    }

    /**
     *
     * @param {string} campaignId
     * @returns {Promise}
     */
    async removeCampaign (campaignId) {
        const c = await this._getCollection(this.campaignsCollection);

        await c.deleteOne({
            id: campaignId
        });
    }

    /**
     *
     * @param {string} campaignId
     * @param {object} increment
     * @returns {Promise}
     */
    async incrementCampaign (campaignId, increment = {}) {
        const c = await this._getCollection(this.campaignsCollection);

        await c.updateOne({
            id: campaignId
        }, {
            $inc: increment
        });
    }

    /**
     *
     * @param {string} campaignId
     * @param {object} data
     * @returns {Promise<Campaign|null>}
     */
    async updateCampaign (campaignId, data) {
        const c = await this._getCollection(this.campaignsCollection);

        const res = await c.findOneAndUpdate({
            id: campaignId
        }, {
            $set: data
        }, {
            returnDocument: 'after'
        });

        return this._mapCampaign(res);
    }

    /**
     *
     * @param {number} [now]
     * @returns {Promise<Campaign|null>}
     */
    async popCampaign (now = Date.now()) {
        const c = await this._getCollection(this.campaignsCollection);

        const res = await c.findOneAndUpdate({
            startAt: { $ne: null, $lte: now },
            active: true
        }, {
            $set: { startAt: null }
        }, {
            returnDocument: 'before'
        });

        return this._mapCampaign(res);
    }

    /**
     *
     * @param {string} campaignId
     * @returns {Promise<null|Campaign>}
     */
    async getCampaignById (campaignId) {
        const c = await this._getCollection(this.campaignsCollection);

        const res = await c.findOne({
            id: campaignId
        });

        return this._mapCampaign(res);
    }

    /**
     *
     * @param {string[]} campaignIds
     * @returns {Promise<Campaign[]>}
     */
    async getCampaignByIds (campaignIds) {
        const c = await this._getCollection(this.campaignsCollection);

        const cursor = c.find({
            id: {
                $in: campaignIds
            }
        })
            .limit(campaignIds.length)
            .map((camp) => this._mapCampaign(camp));

        return cursor.toArray();
    }

    /**
     *
     * @param {object} condition
     * @param {number} [limit]
     * @param {object} [lastKey]
     * @returns {Promise<{data:Campaign[],lastKey:string}>}
     */
    async getCampaigns (condition, limit = null, lastKey = null) {
        const c = await this._getCollection(this.campaignsCollection);

        let useCondition = condition;

        if (lastKey !== null) {
            const key = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));

            useCondition = {
                ...useCondition,
                _id: {
                    $lt: ObjectId.createFromHexString(key._id)
                }
            };
        }

        const cursor = c.find(useCondition)
            .sort({ _id: -1 });

        if (limit !== null) {
            cursor.limit(limit + 1);
        }

        let data = await cursor.toArray();

        let nextLastKey = null;
        if (limit !== null && data.length > limit) {
            data = data.slice(0, limit);

            const last = data[data.length - 1];
            nextLastKey = Buffer.from(JSON.stringify({
                _id: last._id.toHexString()
            })).toString('base64');
        }

        return {
            data: data.map((camp) => this._mapCampaign(camp)),
            lastKey: nextLastKey
        };
    }

    /**
     *
     * @param {SubscriptionData[]} subscriptionData
     * @param {boolean} [onlyToKnown=false]
     * @returns {Promise}
     */
    async batchSubscribe (subscriptionData, onlyToKnown = false) {
        const c = await this._getCollection(this.subscribtionsCollection);

        const toSend = subscriptionData.filter((t) => t.tags.length !== 0);

        while (toSend.length) {
            const up = toSend.splice(0, 999);

            await c.bulkWrite(
                // @ts-ignore
                up.map(({
                    pageId, senderId, tags, meta = {}, remove
                }) => {
                    const set = Object.entries(meta);

                    let addSet = {};

                    if (remove) {
                        addSet = {
                            $set: Object.fromEntries(
                                tags.map((t) => [`meta.${t}`, {}])
                            )
                        };
                    } else if (set.length) {
                        addSet = {
                            $set: Object.fromEntries(
                                set.map(([k, v]) => [`meta.${k}`, v])
                            )
                        };
                    }

                    return {
                        updateOne: {
                            filter: { senderId, pageId },
                            update: {
                                ...(remove
                                    ? { $pullAll: { subs: tags } }
                                    : { $addToSet: { subs: { $each: tags } } }),
                                ...addSet
                            },
                            upsert: !remove && !onlyToKnown
                        }
                    };
                }),
                {
                    ordered: false,
                    writeConcern: {
                        w: onlyToKnown ? 0 : 1
                    }
                }
            );
        }
    }

    /**
     *
     * @param {string|string[]} senderId
     * @param {string} pageId
     * @param {string} tag
     * @param {boolean} [onlyToKnown]
     * @returns {Promise}
     */
    async subscribe (senderId, pageId, tag, onlyToKnown) {
        // !IMPORTANT: do not add a default value to the fourth parameter!
        const senderIds = Array.isArray(senderId) ? senderId : [senderId];

        return this.batchSubscribe(
            senderIds.map((sid) => ({
                senderId: sid,
                pageId,
                tags: [tag]
            })),
            onlyToKnown
        );
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} [tag]
     * @returns {Promise<string[]>}
     */
    async unsubscribe (senderId, pageId, tag = null) {
        const c = await this._getCollection(this.subscribtionsCollection);

        let removeWholeSubscribtion = tag === null;
        const ret = [];

        if (tag !== null) {
            const res = await c.findOneAndUpdate({
                pageId, senderId, subs: tag
            }, {
                // @ts-ignore
                $pull: { subs: tag }
            }, {
                returnDocument: 'after'
            });

            if (res) {
                ret.push(tag);
                removeWholeSubscribtion = res.subs.length === 0;
            } else {
                return [];
            }
        }

        if (removeWholeSubscribtion) {
            const res = await c.findOneAndDelete({ pageId, senderId });
            if (res) {
                ret.push(...res.subs);
            }
        }

        return ret;
    }

    _createSubscribtionsCondition (include, exclude, pageId = null) {
        const condition = {};

        if (include.length !== 0) {
            Object.assign(condition, { subs: { $in: include } });
        }

        if (exclude.length !== 0) {
            if (typeof condition.subs === 'undefined') Object.assign(condition, { subs: {} });

            Object.assign(condition.subs, { $nin: exclude });
        }

        if (pageId !== null) Object.assign(condition, { pageId });

        return condition;
    }

    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {string} [pageId]
     * @returns {Promise<number>}
     */
    async getSubscribtionsCount (include, exclude, pageId = null) {
        const c = await this._getCollection(this.subscribtionsCollection);

        const condition = this._createSubscribtionsCondition(include, exclude, pageId);

        return c.find(condition)
            .project({ _id: 1 })
            .count();
    }

    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {number} limit
     * @param {string} [pageId]
     * @param {*} lastKey
     * @returns {Promise<{data: Target[], lastKey: string }>}
     */
    async getSubscribtions (include, exclude, limit, pageId = null, lastKey = null) {
        const c = await this._getCollection(this.subscribtionsCollection);

        let condition = this._createSubscribtionsCondition(include, exclude, pageId);

        if (lastKey !== null) {
            const key = JSON.parse(Buffer.from(lastKey, 'base64').toString('utf8'));

            condition = {
                ...condition,
                _id: {
                    $gt: ObjectId.createFromHexString(key._id)
                }
            };
        }

        let data = [];
        let hasNext = true;
        let skip = 0;
        const totalLimit = limit || (Number.MAX_SAFE_INTEGER - 1);
        const useLimit = Math.min(999, totalLimit + 1);

        // this is because the cosmodb
        while (hasNext) {

            const cursor = c.find(condition)
                .project({
                    _id: 1,
                    pageId: 1,
                    senderId: 1,
                    ...(include.length === 0
                        ? { meta: 1 }
                        : Object.fromEntries(
                            include.map((k) => [`meta.${k}`, 1])
                        )
                    )
                })
                .sort({ _id: 1 })
                .skip(skip)
                .limit(useLimit);

            const res = await cursor.toArray();
            data.push(...res);

            if (res.length === useLimit && data.length <= totalLimit) {
                skip += useLimit;
            } else {
                hasNext = false;
            }
        }

        let nextLastKey = null;
        if (limit && data.length > limit) {
            data = data.slice(0, limit);

            const last = data[data.length - 1];
            nextLastKey = Buffer.from(JSON.stringify({
                _id: last._id
            })).toString('base64');
        }

        return Promise.resolve({
            data: data.map(({
                senderId, pageId: p, meta
            }) => ({
                senderId, pageId: p, ...(meta ? { meta } : {})
            })),
            lastKey: nextLastKey
        });
    }

    /**
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<Subscription[]>}
     */
    async getSenderSubscriptions (senderId, pageId) {
        const c = await this._getCollection(this.subscribtionsCollection);

        const sub = await c.findOne({
            senderId, pageId
        }, { projection: { _id: 0, subs: 1, meta: 1 } });

        if (sub) {
            return sub.subs.map((tag) => ({
                tag,
                meta: (sub.meta && sub.meta[tag]) || {}
            }));
        }

        return [];
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<string[]>}
     */
    async getSenderSubscribtions (senderId, pageId) {
        const subs = await this.getSenderSubscriptions(senderId, pageId);
        return subs.map((s) => s.tag);
    }

    async getTags (pageId = null) {
        const c = await this._getCollection(this.subscribtionsCollection);

        const pipeline = [
            {
                $project: { subs: 1 }
            },
            {
                $unwind: '$subs'
            },
            {
                $group: {
                    _id: '$subs',
                    subscribtions: { $sum: 1 }
                }
            },
            { $sort: { subscribtions: -1 } }
        ];

        if (pageId) {
            // @ts-ignore
            pipeline.unshift({ $match: { pageId } });
        }

        const res = await c.aggregate(pipeline);

        const arr = await res.toArray();

        return arr.map(({ _id: tag, subscribtions }) => ({ tag, subscribtions }));
    }

}

module.exports = NotificationsStorage;
