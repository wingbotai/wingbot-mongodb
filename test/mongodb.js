/*
 * @author David Menger
 */
'use strict';

const mongodb = require('mongodb');

const CONNECTION_STRING = 'mongodb://127.0.0.1:27017';

let connectedMongoDb;

async function connect (disconnect) {
    if (disconnect && !connectedMongoDb) {
        return null;
    } else if (disconnect) {
        return connectedMongoDb
            .then((connection) => {
                connectedMongoDb = null;
                return connection.close();
            });
    }

    if (!connectedMongoDb) {
        connectedMongoDb = mongodb.connect(CONNECTION_STRING);
    }

    return connectedMongoDb
        .then(connection => connection.db('wingbot-mongodb-test'));
}

module.exports = connect;
