/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const AttachmentCache = require('../src/AttachmentCache');
const mongodb = require('./mongodb');

const TEST_URL = 'abc';

describe('<AttachmentCache>', function () {

    /** @type {AttachmentCache} */
    let attachmentCache;

    before(async () => {
        const db = await mongodb();

        attachmentCache = new AttachmentCache(db);
    });

    after(async () => {
        const c = await attachmentCache._getCollection();

        await c.drop();

        await mongodb(true);
    });

    it('should be able to store and fetch the cached item', async () => {
        const nothing = await attachmentCache.findAttachmentByUrl(TEST_URL);

        assert.strictEqual(nothing, null);

        // save to cache
        await attachmentCache.saveAttachmentId(TEST_URL, 1);

        const something = await attachmentCache.findAttachmentByUrl(TEST_URL);

        assert.strictEqual(something, 1);
    });

});
