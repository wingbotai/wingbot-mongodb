export = NotificationsStorage;
declare class NotificationsStorage {
    /**
     *
     * @param {mongodb.Db|{():Promise<mongodb.Db>}} mongoDb
     * @param {string} collectionsPrefix
     * @param {{error:Function,log:Function}} [log] - console like logger
     * @param {boolean} isCosmo
     */
    constructor(mongoDb: mongodb.Db | {
        (): Promise<mongodb.Db>;
    }, collectionsPrefix?: string, log?: {
        error: Function;
        log: Function;
    }, isCosmo?: boolean);
    _mongoDb: mongodb.Db | (() => Promise<mongodb.Db>);
    taksCollection: string;
    campaignsCollection: string;
    subscribtionsCollection: string;
    _isCosmo: boolean;
    _log: {
        error: Function;
        log: Function;
    };
    /**
     * @type {Map<string,Promise<mongodb.Collection>>}
     */
    _collections: Map<string, Promise<mongodb.Collection>>;
    _getOrCreateCollection(name: any): Promise<mongodb.Collection<mongodb.BSON.Document>>;
    /**
     * @param {string} collectionName
     * @returns {Promise<mongodb.Collection>}
     */
    _getCollection(collectionName: string): Promise<mongodb.Collection>;
    _ensureIndexes(collection: any, indexes: any): Promise<void>;
    _doesNotSupportTextIndex: boolean;
    /**
     *
     * @param {object} tasks
     * @returns {Promise<Task[]>}
     */
    pushTasks(tasks: object): Promise<Task[]>;
    _mapGenericObject(obj: any): any;
    _mapCampaign(camp: any): any;
    popTasks(limit: any, until?: number): Promise<any[]>;
    /**
     *
     * @param {string} campaignId
     * @param {boolean} [sentWithoutReaction]
     * @param {string} [pageId]
     */
    getUnsuccessfulSubscribersByCampaign(campaignId: string, sentWithoutReaction?: boolean, pageId?: string): Promise<mongodb.BSON.Document[]>;
    /**
     * Return Task By Id
     *
     * @param {string} taskId
     * @returns {Promise<Task|null>}
     */
    getTaskById(taskId: string): Promise<Task | null>;
    /**
     *
     * @param {string} taskId
     * @param {object} data
     */
    updateTask(taskId: string, data: object): Promise<any>;
    /**
     * Get last sent task from campaign
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} campaignId
     * @returns {Promise<Task|null>}
     */
    getSentTask(pageId: string, senderId: string, campaignId: string): Promise<Task | null>;
    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string[]} checkCampaignIds
     * @returns {Promise<string[]>}
     */
    getSentCampagnIds(pageId: string, senderId: string, checkCampaignIds: string[]): Promise<string[]>;
    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {number} watermark
     * @param {('read'|'delivery')} eventType
     * @param {number} ts
     * @returns {Promise<Task[]>}
     */
    updateTasksByWatermark(senderId: string, pageId: string, watermark: number, eventType: ("read" | "delivery"), ts?: number): Promise<Task[]>;
    /**
     *
     * @param {object} campaign
     * @param {object} [updateCampaign]
     * @returns {Promise<Campaign>}
     */
    upsertCampaign(campaign: object, updateCampaign?: object): Promise<Campaign>;
    /**
     *
     * @param {string} campaignId
     * @returns {Promise}
     */
    removeCampaign(campaignId: string): Promise<any>;
    /**
     *
     * @param {string} campaignId
     * @param {object} increment
     * @returns {Promise}
     */
    incrementCampaign(campaignId: string, increment?: object): Promise<any>;
    /**
     *
     * @param {string} campaignId
     * @param {object} data
     * @returns {Promise<Campaign|null>}
     */
    updateCampaign(campaignId: string, data: object): Promise<Campaign | null>;
    /**
     *
     * @param {number} [now]
     * @returns {Promise<Campaign|null>}
     */
    popCampaign(now?: number): Promise<Campaign | null>;
    /**
     *
     * @param {string} campaignId
     * @returns {Promise<null|Campaign>}
     */
    getCampaignById(campaignId: string): Promise<null | Campaign>;
    /**
     *
     * @param {string[]} campaignIds
     * @returns {Promise<Campaign[]>}
     */
    getCampaignByIds(campaignIds: string[]): Promise<Campaign[]>;
    /**
     *
     * @param {object} condition
     * @param {number} [limit]
     * @param {object} [lastKey]
     * @returns {Promise<{data:Campaign[],lastKey:string}>}
     */
    getCampaigns(condition: object, limit?: number, lastKey?: object): Promise<{
        data: Campaign[];
        lastKey: string;
    }>;
    /**
     *
     * @param {SubscriptionData[]} subscriptionData
     * @param {boolean} [onlyToKnown=false]
     * @returns {Promise}
     */
    batchSubscribe(subscriptionData: SubscriptionData[], onlyToKnown?: boolean): Promise<any>;
    /**
     *
     * @param {string|string[]} senderId
     * @param {string} pageId
     * @param {string} tag
     * @param {boolean} [onlyToKnown]
     * @returns {Promise}
     */
    subscribe(senderId: string | string[], pageId: string, tag: string, onlyToKnown?: boolean): Promise<any>;
    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {string} [tag]
     * @returns {Promise<string[]>}
     */
    unsubscribe(senderId: string, pageId: string, tag?: string): Promise<string[]>;
    _createSubscribtionsCondition(include: any, exclude: any, pageId?: any): {};
    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {string} [pageId]
     * @returns {Promise<number>}
     */
    getSubscribtionsCount(include: string[], exclude: string[], pageId?: string): Promise<number>;
    /**
     *
     * @param {string[]} include
     * @param {string[]} exclude
     * @param {number} limit
     * @param {string} [pageId]
     * @param {*} lastKey
     * @returns {Promise<{data: Target[], lastKey: string }>}
     */
    getSubscribtions(include: string[], exclude: string[], limit: number, pageId?: string, lastKey?: any): Promise<{
        data: Target[];
        lastKey: string;
    }>;
    /**
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<Subscription[]>}
     */
    getSenderSubscriptions(senderId: string, pageId: string): Promise<Subscription[]>;
    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @returns {Promise<string[]>}
     */
    getSenderSubscribtions(senderId: string, pageId: string): Promise<string[]>;
    getTags(pageId?: any): Promise<{
        tag: any;
        subscribtions: any;
    }[]>;
}
declare namespace NotificationsStorage {
    export { Target, Subscribtion, Campaign, Task, Subscription, SubscriptionData };
}
import mongodb = require("mongodb");
type Target = {
    senderId: string;
    pageId: string;
    meta?: {
        [key: string]: object;
    };
};
type Subscribtion = {
    senderId: string;
    pageId: string;
    subs: string[];
};
type Campaign = {
    id: string;
    /**
     * Tatgeting
     */
    name: string;
    include: string[];
    /**
     * Stats
     */
    exclude: string[];
    sent: number;
    succeeded: number;
    failed: number;
    unsubscribed: number;
    delivery: number;
    read: number;
    notSent: number;
    leaved: number;
    /**
     * Interaction
     */
    queued: number;
    action: string;
    /**
     * Setup
     */
    data?: object;
    sliding: boolean;
    slide: number;
    slideRound: number;
    active: boolean;
    in24hourWindow: boolean;
    startAt: number;
};
type Task = {
    id: string;
    pageId: string;
    senderId: string;
    campaignId: string;
    enqueue: number;
    read?: number;
    delivery?: number;
    sent?: number;
    insEnqueue?: number;
    /**
     * - user reacted
     */
    reaction?: boolean;
    /**
     * - time the event was not sent because user left
     */
    leaved?: number;
};
type Subscription = {
    tag: string;
    meta: object;
};
type SubscriptionData = {
    pageId: string;
    senderId: string;
    tags: string[];
    remove?: boolean;
    meta?: {
        [key: string]: object;
    };
};
