/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const mongodb = require('./mongodb');
const StateStorage = require('../src/StateStorage');

const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';
const PAGE_ID = 'hello2';


describe('<StateStorage>', function () {

    /** @type {StateStorage} */
    let ss;

    before(async () => {
        const db = await mongodb();

        ss = new StateStorage(db);

        try {
            await db.dropCollection(ss._collectionName);
        } catch (e) {
            // suppress
        }
    });

    after(() => mongodb(true));

    describe('#getOrCreateAndLock()', () => {

        it('creates state and locks it', async () => {
            let res = await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 2000);

            let thrownError = null;

            try {
                res = await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 2000);
            } catch (e) {
                thrownError = e;
            }

            assert.ok(thrownError !== null);
            assert.strictEqual(thrownError.code, 11000);

            assert.strictEqual(typeof res, 'object');
            assert.strictEqual(res.senderId, SENDER_ID);
            assert.strictEqual(res.pageId, PAGE_ID);
            assert.deepStrictEqual(res.state, {});
        });

    });

    describe('#getState()', () => {

        it('returns zero state', async () => {
            ss = new StateStorage(mongodb);

            const nonexisting = await ss.getState('nonexisting', 'random');

            assert.strictEqual(nonexisting, null);

            await ss.getOrCreateAndLock('x', PAGE_ID, {}, 500);

            const existing = await ss.getState('x', PAGE_ID);

            assert.strictEqual(typeof existing, 'object');
            assert.strictEqual(existing.senderId, 'x');
            assert.strictEqual(existing.pageId, PAGE_ID);
            assert.deepStrictEqual(existing.state, {});
        });

    });

    describe('#saveState()', () => {

        it('is able to recover state from db and encodes dates', async () => {
            ss = new StateStorage(mongodb);

            const state = {
                dateTest: new Date(),
                listTest: [
                    { d: 1 },
                    { d: 2 },
                    { d: new Date() }
                ]
            };

            await ss.saveState({
                senderId: SENDER_ID2,
                pageId: PAGE_ID,
                state,
                lock: 0
            });

            const savedState = await ss.getOrCreateAndLock(SENDER_ID2, PAGE_ID, {}, 100);

            assert.deepStrictEqual(savedState.state, state);
        });

    });

});
