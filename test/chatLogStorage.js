/*
 * @author David Menger
 */
'use strict';

const ChatLogStorage = require('../src/ChatLogStorage');
const mongodb = require('./mongodb');

const SENDER_ID = 'hello';


describe('<ChatLogStorage>', function () {

    /** @type {ChatLogStorage} */
    let chl;

    before(async () => {
        const db = await mongodb();

        chl = new ChatLogStorage(db);
    });

    after(() => mongodb(true));

    describe('#log()', () => {

        it('stores data without error', async () => {
            chl.muteErrors = false;

            await chl.log(SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            await chl.log(SENDER_ID);
        });

    });

    describe('#error()', () => {

        it('stores error without fail', async () => {
            chl.muteErrors = false;

            await chl.error(new Error('something failed'), SENDER_ID, [{ response: 1 }], { req: 1 });
        });

        it('mutes errors', async () => {
            chl = new ChatLogStorage(mongodb);

            await chl.error(new Error('something failed'), SENDER_ID);
        });

    });

});
