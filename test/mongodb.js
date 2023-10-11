/*
 * @author David Menger
 */
'use strict';

const { MongoClient } = require('mongodb');

const CONNECTION_STRING = 'mongodb://127.0.0.1:27017';

let settings;
if (process.env.DB_TYPE === 'cosmos') {
    try {
        // @ts-ignore
        settings = module.require('./dbSettings');
    } catch (e) {
        console.warn('missing test/dbSettings.js for cosmosdb'); // eslint-disable-line
    }
}

if (!settings) {
    settings = {
        db: CONNECTION_STRING,
        options: {}
    };
}

/** @typedef {import('mongodb').Db} Db */

/** @type {Promise<MongoClient>} */
let connectedMongoDb;

/**
 *
 * @param {boolean} [disconnect]
 * @returns {Promise<Db>}
 */
async function connect (disconnect = false) {
    if (disconnect && !connectedMongoDb) {
        return null;
    }

    if (disconnect) {
        return connectedMongoDb
            .then((connection) => {
                connectedMongoDb = null;
                return connection.close();
            })
            .then(() => null);
    }

    if (!connectedMongoDb) {
        connectedMongoDb = new MongoClient(settings.db, settings.options)
            .connect();
    }

    return connectedMongoDb
        .then((connection) => connection.db('wingbot-mongodb-test'));
}

module.exports = connect;
