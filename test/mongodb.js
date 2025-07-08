/*
 * @author David Menger
 */
'use strict';

const { MongoClient } = require('mongodb');

const CONNECTION_STRING = 'mongodb://127.0.0.1:27017';

let dbSettings;
try {
    // @ts-ignore
    dbSettings = module.require('./dbSettings');
} catch (e) {
    if (process.env.DB_TYPE === 'cosmos') {
        throw new Error('missing test/dbSettings.js for cosmosdb');
    }
}

let settings = {
    url: CONNECTION_STRING,
    options: {},
    name: 'wingbot-mongodb-test'
};

if (dbSettings) {
    settings = { ...settings, ...dbSettings };
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
        connectedMongoDb = new MongoClient(settings.url, settings.options)
            .connect();
    }

    return connectedMongoDb
        .then((connection) => connection.db(settings.name));
}

module.exports = connect;
