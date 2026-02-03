export = AttachmentCache;
/**
 * @typedef {object} StoredAttachment
 * @prop {string} _id
 * @prop {number} attachmentId
 */
/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection<StoredAttachment>} Collection */
/**
 * Cache storage for Facebook attachments
 *
 * @class
 */
declare class AttachmentCache {
    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor(mongoDb: Db | {
        (): Promise<Db>;
    }, collectionName?: string);
    _mongoDb: import("mongodb").Db | (() => Promise<Db>);
    _collectionName: string;
    /**
     * @type {Collection}
     */
    _collection: Collection;
    /**
     * @returns {Promise<Collection>}
     */
    _getCollection(): Promise<Collection>;
    /**
     *
     * @param {string} url
     * @returns {Promise<number|null>}
     */
    findAttachmentByUrl(url: string): Promise<number | null>;
    /**
     *
     * @param {string} url
     * @param {number} attachmentId
     * @returns {Promise}
     */
    saveAttachmentId(url: string, attachmentId: number): Promise<any>;
}
declare namespace AttachmentCache {
    export { StoredAttachment, Db, Collection };
}
type StoredAttachment = {
    _id: string;
    attachmentId: number;
};
type Db = import("mongodb").Db;
type Collection = import("mongodb").Collection<StoredAttachment>;
