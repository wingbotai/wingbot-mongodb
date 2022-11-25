/*
* @author David Menger
*/
'use strict';

const tokenFactory = require('./tokenFactory');

const TOKEN_INDEX = 'token-index';
const USER_INDEX = 'user-page-index';

/**
 * @typedef {object} Token
 * @prop {string} senderId
 * @prop {string} pageId
 * @prop {string} token
 */

/** @typedef {import('mongodb').Db} Db */
/** @typedef {import('mongodb').Collection} Collection */

/**
 * Storage for webview tokens
 *
 * @class
 */
class BotTokenStorage {

    /**
     *
     * @param {Db|{():Promise<Db>}} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'tokens') {
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
            let indexExists;
            try {
                indexExists = await this._collection.indexExists(TOKEN_INDEX);
            } catch (e) {
                indexExists = false;
            }
            if (!indexExists) {
                await this._collection.createIndex({
                    token: 1
                }, {
                    unique: true,
                    name: TOKEN_INDEX
                });
            }
            try {
                indexExists = await this._collection.indexExists(USER_INDEX);
            } catch (e) {
                indexExists = false;
            }
            if (!indexExists) {
                await this._collection.createIndex({
                    senderId: 1,
                    pageId: 1
                }, {
                    unique: true,
                    name: USER_INDEX
                });
            }
        }
        return this._collection;
    }

    /**
     *
     * @param {string} token
     * @returns {Promise<Token|null>}
     */
    async findByToken (token) {
        if (!token) {
            return null;
        }
        const c = await this._getCollection();

        const res = await c.findOne({ token });

        if (!res) {
            return null;
        }

        return {
            senderId: res.senderId,
            token: res.token,
            pageId: res.pageId
        };
    }

    /**
     *
     * @param {string} senderId
     * @param {string} pageId
     * @param {{(): Promise<string>}} createToken
     * @returns {Promise<Token|null>}
     */
    async getOrCreateToken (senderId, pageId, createToken = tokenFactory) {
        if (!senderId) {
            throw new Error('Missing sender ID');
        }

        const temporaryInsecureToken = `>${Math.random() * 0.9}${Date.now()}`;

        const c = await this._getCollection();

        let res = await c.findOneAndUpdate({
            senderId, pageId
        }, {
            $setOnInsert: {
                token: temporaryInsecureToken
            }
        }, {
            upsert: true,
            returnDocument: 'after'
        });

        // @ts-ignore
        res = res.value;

        // @ts-ignore
        if (res.token === temporaryInsecureToken) {

            const token = await createToken();

            Object.assign(res, { token });

            await c.updateOne({ senderId, pageId }, { $set: { token } });

        // @ts-ignore
        } else if (res.token.match(/^>[0-9.]+$/)) {
            // probably collision, try it again
            await this._wait(400);

            // @ts-ignore
            res = await c.findOne({ senderId, pageId });

            if (!res) {
                throw new Error('Cant create token');
            }
        }

        return {
            senderId,
            // @ts-ignore
            token: res.token,
            pageId
        };
    }

    _wait (ms) {
        return new Promise((r) => { setTimeout(r, ms); });
    }

}

module.exports = BotTokenStorage;
