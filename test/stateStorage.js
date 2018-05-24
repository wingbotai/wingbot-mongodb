/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const mongodb = require('./mongodb');
const StateStorage = require('../src/StateStorage');

const SENDER_ID = 'hello';
const SENDER_ID2 = 'hello2';


describe('<StateStorage>', function () {

    /** @type {StateStorage} */
    let ss;

    before(async () => {
        const db = await mongodb();

        ss = new StateStorage(db);
    });

    after(() => mongodb(true));

    describe('#getOrCreateAndLock()', () => {

        it('creates state and locks it', async () => {
            await ss.getOrCreateAndLock(SENDER_ID, {}, 100);

            let thrownError = null;

            try {
                await ss.getOrCreateAndLock(SENDER_ID, {}, 100);
            } catch (e) {
                thrownError = e;
            }

            assert.ok(thrownError !== null);
            assert.strictEqual(thrownError.code, 11000);
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
                state,
                lock: 0
            });

            const savedState = await ss.getOrCreateAndLock(SENDER_ID2, {}, 100);

            assert.deepStrictEqual(savedState.state, state);
        });

    });

});
