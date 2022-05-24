/*
 * @author David Menger
 */
'use strict';

/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */

/**
 * Cache storage for Facebook attachments
 *
 * @class
 */
class AttachmentCache {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'attachments') {
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
     *
     * @param {string} url
     * @returns {Promise<number|null>}
     */
    async findAttachmentByUrl (url) {
        const c = await this._getCollection();
        const res = await c.findOne({
            _id: url
        }, {
            limit: 1,
            projection: { _id: 0, attachmentId: 1 }
        });

        return res ? res.attachmentId : null;
    }

    /**
     *
     * @param {string} url
     * @param {number} attachmentId
     * @returns {Promise}
     */
    async saveAttachmentId (url, attachmentId) {
        const c = await this._getCollection();

        await c.replaceOne({ _id: url }, { _id: url, attachmentId }, { upsert: true });
    }

}

module.exports = AttachmentCache;
