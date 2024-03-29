/*
 * @author David Menger
 */
'use strict';

const { MongoClient } = require('mongodb');
const assert = require('assert');
const mongodb = require('./mongodb');
const StateStorage = require('../src/StateStorage');
const BaseStorage = require('../src/BaseStorage');

const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';
const PAGE_ID = 'pid';

describe('<StateStorage>', function () {

    /** @type {StateStorage} */
    let ss;

    beforeEach(async () => {
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

            await ss.saveState(res);
        });

    });

    describe('#getOrCreateAndLock() without unique index', () => {

        this.beforeEach(() => {
            ss._indexes = ss._indexes.filter((i) => !i.options.unique);
            ss._uniqueIndexFailed = true;
        });

        it('creates state and locks it', async () => {
            let res = await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 2000);

            let thrownError = null;

            try {
                res = await ss.getOrCreateAndLock(SENDER_ID, PAGE_ID, {}, 2000);
            } catch (e) {
                thrownError = e;
            }

            const all = await ss.getStates();

            assert.strictEqual(all.data.length, 1);

            assert.ok(thrownError !== null);
            assert.strictEqual(thrownError.code, 11000);

            assert.strictEqual(typeof res, 'object');
            assert.strictEqual(res.senderId, SENDER_ID);
            assert.strictEqual(res.pageId, PAGE_ID);
            assert.deepStrictEqual(res.state, {});

            await ss.saveState(res);
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

            await ss.saveState(savedState);
        });

    });

    describe('#getStates()', () => {

        let storage;
        const secondState = { x: 2 };
        const firstState = { x: 1 };
        const lastInteraction = new Date(Date.now() - 2000);
        const lastInteraction2 = new Date(Date.now() - 1000);

        beforeEach(async () => {
            storage = new StateStorage(mongodb);

            const first = await storage.getOrCreateAndLock(SENDER_ID, PAGE_ID, firstState);
            const second = await storage.getOrCreateAndLock(SENDER_ID2, PAGE_ID, secondState);

            await storage.saveState({ ...first, lastInteraction });
            await storage.saveState({ ...second, lastInteraction: lastInteraction2 });
        });

        it('should return states by last interaction', async () => {
            let { data, lastKey } = await storage.getStates({}, 1);

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                state: data[0].state,
                lastInteraction: lastInteraction2
            }]);

            ({ data, lastKey } = await storage.getStates({}, 1, lastKey));

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID,
                state: data[0].state,
                lastInteraction
            }]);

            assert.strictEqual(lastKey, null);
        });

        it('should be able to use search', async () => {
            const { data, lastKey } = await storage.getStates({
                search: SENDER_ID2
            });

            assert.deepEqual(data, [{
                pageId: PAGE_ID,
                senderId: SENDER_ID2,
                state: data[0].state,
                lastInteraction: lastInteraction2
            }]);

            assert.strictEqual(lastKey, null);
        });

    });

    describe('#kill feature', () => {

        it('kills the application, if network error occurs', (done) => {
            const connection = new MongoClient('mongodb://localhost:6666/any', {
                connectTimeoutMS: 500,
                serverSelectionTimeoutMS: 500
            });

            const s = new StateStorage(connection.db('db'), 'anystate', console, 2);

            s.getOrCreateAndLock('sender', 'pid', {}, 1000)
                .catch((e) => {
                    // eslint-disable-next-line
                    console.log(e.message);

                    // @ts-ignore
                    BaseStorage.killer = () => {
                        done();
                    };

                    s.getOrCreateAndLock('sender', 'pid', {}, 1000)
                        .catch((er) => {
                            // eslint-disable-next-line
                            console.log(er.message);
                        });
                });

        }).timeout(10000);

    });

});
