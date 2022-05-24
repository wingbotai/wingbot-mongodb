/**
 * @author David Menger
 */
'use strict';

const { strict: assert } = require('assert');
const BaseStorage = require('../src/BaseStorage');
const mongodb = require('./mongodb');

const TEST_OBJ = {
    some: {
        nested: {
            prop: 'hello',
            foo: 'bar',
            undef: undefined
        },
        arr: [1, 2]
    },
    root: null
};

describe('<BaseStorage>', () => {

    /** @type {BaseStorage} */
    let storage;

    beforeEach(async () => {
        const db = await mongodb();

        storage = new BaseStorage(db, 'basestorage');
    });

    describe('#_expandObjectToSet()', () => {

        it('should extract nested objects', async () => {
            assert.deepStrictEqual(
                storage._expandObjectToSet(null, TEST_OBJ, true),
                {
                    'some.nested.prop': 'hello',
                    'some.nested.foo': 'bar',
                    'some.nested.undef': null,
                    'some.arr': [1, 2],
                    root: null
                }
            );
        });

        it('should keep nested objects', async () => {
            assert.deepStrictEqual(
                storage._expandObjectToSet('attr', TEST_OBJ),
                {
                    'attr.some': {
                        nested: {
                            prop: 'hello',
                            foo: 'bar',
                            undef: undefined
                        },
                        arr: [1, 2]
                    },
                    'attr.root': null
                }
            );
        });

    });

});
