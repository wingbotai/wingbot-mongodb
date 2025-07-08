/*
 * @author Vojtěch Jedlička
 */
'use strict';

const { MongoClient } = require('mongodb');
const defaultLogger = require('./defaultLogger');

/** @typedef {import('mongodb').Db} Db */

/**
 * @param {Db} db
 * @returns {Promise<string[]>}
 */
async function getCompactableCollections (db) {
    const collections = await db
        .listCollections({ type: 'collection' })
        .toArray();
    return collections
        .map((v) => v.name)
        .filter(
            (name) => !name.startsWith('system.')
        && !name.startsWith('admin.')
        && !name.includes('.chunks')
        && !name.includes('.files')
        && name !== 'oplog.rs'
        );
}

/**
 * Returns host addresses of replica set nodes
 *
 * @param {Db} db
 * @returns {Promise<{primary: string, secondaries: string[]}>}
 */
async function getReplicaSetNodes (db) {
    const admin = db.admin();
    const status = await admin.command({ replSetGetStatus: 1 });

    const primary = status.members.find((member) => member.state === 1);
    const secondaries = status.members.filter((member) => member.state === 2);

    return {
        primary: primary ? primary.name : null,
        secondaries: secondaries.map((member) => member.name)
    };
}

/**
 * Compacts all collections on a given replica set node
 *
 * @param {object} props
 * @param {string} props.nodeUrl
 * @param {boolean} [props.force]
 * @param {string} props.dbUrl
 * @param {string} props.dbName
 * @param {string[]} props.collections
 * @param {any} props.log
 * @returns {Promise<{bytesFreed:number}>}
 */
async function compactNode ({
    nodeUrl, collections, force = false, dbUrl, dbName, log = defaultLogger
}) {
    log.info(`Starting compaction for node: ${nodeUrl}`);

    const nodeHost = nodeUrl.replace('mongodb://', '');

    const originalUrl = new URL(
        dbUrl.replace('mongodb+srv://', 'https://')
    );
    const { username } = originalUrl;
    const { password } = originalUrl;

    const authPart = username && password ? `${username}:${password}@` : '';
    const directConnectionUrl = `mongodb://${authPart}${nodeHost}/${dbName}?authSource=admin&ssl=true`;

    const client = new MongoClient(directConnectionUrl, {
        directConnection: true,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000
    });

    try {
        await client.connect();
        const db = client.db(dbName);

        const compactionPromises = collections.map(async (collectionName) => {
            try {
                const result = await db.command({
                    compact: collectionName,
                    force
                });
                log.info(
                    `Successfully compacted ${collectionName} on ${nodeUrl}:`,
                    result
                );

                return result;
            } catch (error) {
                log.error(`Failed to compact ${collectionName} on ${nodeUrl}:`, error);
                throw error;
            }
        });

        const results = await Promise.allSettled(compactionPromises);

        const bytesFreed = results
            .filter((result) => result.status === 'fulfilled')
            .reduce((a, p) => a + p.value.bytesFreed, 0);

        log.info(`Completed compaction for node: ${nodeUrl}`);

        return { bytesFreed };
    } catch (e) {
        log.error(e);
        return { bytesFreed: 0 };
    } finally {
        await client.close();
    }
}

/**
 * @param {Db} db
 * @param {string} dbUrl
 * @param {string} dbName
 * @param {any} log
 * @returns {Promise<{bytesFreed: number}>}
 */
async function compact (db, dbUrl, dbName, log = defaultLogger) {
    const collections = await getCompactableCollections(db);
    const replicaSetNodes = await getReplicaSetNodes(db);

    log.info('Starting replica set compaction...');
    log.info(`Collections to compact: ${collections.join(', ')}`);
    log.info(`Primary: ${replicaSetNodes.primary}`);
    log.info(`Secondaries: ${replicaSetNodes.secondaries.join(', ')}`);

    let bytesFreed = 0;

    for (const secondary of replicaSetNodes.secondaries) {
        const result = await compactNode({
            nodeUrl: secondary, dbUrl, dbName, collections, log
        });

        bytesFreed += result.bytesFreed;
    }

    if (replicaSetNodes.primary) {
        log.info(
            `Compacting primary ${replicaSetNodes.primary}`
        );

        const result = await compactNode({
            nodeUrl: replicaSetNodes.primary,
            collections,
            force: true,
            dbUrl,
            dbName,
            log
        });

        bytesFreed += result.bytesFreed;
    } else {
        log.warn('No primary replica set node!');
    }

    return { bytesFreed };
}

module.exports = compact;
module.exports.compactNode = compactNode;
module.exports.getCompactableCollections = getCompactableCollections;
module.exports.getReplicaSetNodes = getReplicaSetNodes;
