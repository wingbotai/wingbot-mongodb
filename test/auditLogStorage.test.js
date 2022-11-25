/**
 * @author wingbot.ai
 */
'use strict';

const assert = require('assert');
const jsonwebtoken = require('jsonwebtoken');
const AuditLogStorage = require('../src/AuditLogStorage');
const mongodb = require('./mongodb');

describe('AuditLogStorage', () => {

    /** @type {AuditLogStorage} */
    let auditLog;

    it('solves conditions and verifies data', async () => {
        const db = await mongodb();

        auditLog = new AuditLogStorage(db, 'auditlog', console, false, 'sasalele');

        auditLog.defaultWid = `${Math.random()}${Date.now()}`;

        await Promise.all([
            auditLog.log({
                category: 'foo',
                action: 'x'
            }, { id: 'a' }),
            auditLog.log({
                category: 'bar',
                action: 'y'
            }, { id: 'a' })
        ]);

        const res = await auditLog.list();

        assert.ok(res.length === 2);
        assert.ok(res.every((log) => log.ok));

        // not sure if this occurs at every test
        // assert.ok(res.some((log) => log.delta), 'one item is resolved as a write conflict');

        const res2 = await auditLog.list(auditLog.defaultWid, 0, 1);

        assert.ok(res2.length === 1);
        assert.ok(res2.every((log) => log.ok));
    });

    it('checks JWT', async () => {
        const db = await mongodb();

        auditLog = new AuditLogStorage(db, 'auditlog', console, false, null, 'sasalele');

        auditLog.defaultWid = `${Math.random()}${Date.now()}`;

        const jwt = jsonwebtoken.sign({ id: 'a' }, 'sasalele');

        await auditLog.log({
            category: 'foo',
            action: 'x'
        }, { id: 'a', jwt });

        const res = await auditLog.list();

        assert.ok(res.length === 1);
        assert.ok(res.every((log) => log.ok));
    });

});
