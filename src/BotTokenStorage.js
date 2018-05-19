/*
* @author David Menger
*/
'use strict';

const mongodb = require('mongodb'); // eslint-disable-line no-unused-vars
const tokenFactory = require('./tokenFactory');

const TOKEN_INDEX = 'token-index';

/**
 * Storage for webview tokens
 *
 * @class
 */
class BotTokenStorage {

    /**
     *
     * @param {mongodb.Db} mongoDb
     * @param {string} collectionName
     */
    constructor (mongoDb, collectionName = 'tokens') {
        this._mongoDb = mongoDb;
        this._collectionName = collectionName;

        /**
         * @type {mongodb.Collection}
         */
        this._collection = null;
    }

    async _getCollection () {
        if (this._collection === null) {
            this._collection = this._mongoDb.collection(this._collectionName);

            try {
                await this._collection.indexExists(TOKEN_INDEX);
            } catch (e) {
                await this._collection.createIndex({
                    token: 1
                }, {
                    unique: true,
                    name: TOKEN_INDEX
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
            senderId: res._id,
            token: res.token
        };
    }

    /**
     *
     * @param {string} senderId
     * @param {{(): Promise<string>}} createToken
     * @returns {Promise<Token|null>}
     */
    async getOrCreateToken (senderId, createToken = tokenFactory) {
        if (!senderId) {
            throw new Error('Missing sender ID');
        }

        const temporaryInsecureToken = `>${Math.random() * 0.9}${Date.now()}`;

        const c = await this._getCollection();

        let res = await c.findOneAndUpdate({
            _id: senderId
        }, {
            $setOnInsert: {
                token: temporaryInsecureToken
            }
        }, {
            upsert: true,
            returnOriginal: false
        });

        res = res.value;

        if (res.token === temporaryInsecureToken) {

            const token = await createToken();

            Object.assign(res, { token });

            await c.updateOne({ _id: senderId }, { $set: { token } });

        } else if (res.token.match(/^>[0-9.]+$/)) {
            // probably collision, try it again
            await this._wait(400);

            res = await c.findOne({ _id: senderId });

            if (!res) {
                throw new Error('Cant create token');
            }
        }

        return {
            senderId,
            token: res.token
        };
    }

    _wait (ms) {
        return new Promise(r => setTimeout(r, ms));
    }

}

module.exports = BotTokenStorage;
