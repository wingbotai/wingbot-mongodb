/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const mongodb = require('./mongodb');
const BotConfigStorage = require('../src/BotConfigStorage');

describe('<BotConfigStorage>', () => {

    /** @type {BotConfigStorage} */
    let botConfigStorage;

    before(async () => {
        const db = await mongodb();

        botConfigStorage = new BotConfigStorage(db);
    });

    after(() => mongodb(true));

    it('should be able to store and fetch, invalidate and update config under same timestamp', async () => {
        const cfgObj = { blocks: 123 };

        // save config
        const savedConfig = await botConfigStorage.updateConfig(cfgObj);

        assert.strictEqual(savedConfig.blocks, cfgObj.blocks);

        // check for config timestamp
        const ts = await botConfigStorage.getConfigTimestamp();

        assert.strictEqual(ts, savedConfig.timestamp);

        // try another
        botConfigStorage = new BotConfigStorage(mongodb);

        // load config
        const loadedConfig = await botConfigStorage.getConfig();

        assert.deepStrictEqual(loadedConfig, savedConfig);

        // invalidate config
        await botConfigStorage.invalidateConfig();

        const emptyTs = await botConfigStorage.getConfigTimestamp();
        const emptyConfig = await botConfigStorage.getConfig();

        assert.strictEqual(emptyTs, 0);
        assert.strictEqual(emptyConfig, null);
    });

});
