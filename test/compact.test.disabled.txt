/*
 * @author Vojtěch Jedlička
 */
'use strict';

const { strict: assert } = require('assert');
const mongodb = require('./mongodb');
const { getCompactableCollections, getReplicaSetNodes } = require('../src/compact');
const compact = require('../src/compact');
const dbSettings = require('./dbSettings');

// run this test on mongo cluster
describe.skip('Compacting', function () {

    let db;

    before(async () => {
        db = await mongodb();
        if (!db) {
            throw new Error('Failed to connect to the database');
        }
    });

    it('should connect to database', async () => {
        assert(db);
        assert.strictEqual(db.databaseName, dbSettings.name);
    });

    it('should list all collections', async () => {
        const collections = await getCompactableCollections(db);
        assert(collections.length > 0);
        // console.log(collections);
    });

    it('should get replica set nodes', async () => {
        const nodes = await getReplicaSetNodes(db);
        assert(nodes);
        assert(nodes.primary);
        assert(nodes.secondaries.length >= 0);
    });

    it('should compact the whole cluster', async function () {
        this.timeout(120000);
        const result = await compact(db, dbSettings.url, dbSettings.name);

        assert(result.bytesFreed === 0);
    });

});
