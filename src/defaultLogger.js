/**
 * @author {David Menger}
 */
'use strict';

function log (...args) {
    const mapped = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2)));
    process.stderr.write(` + ${mapped.join(' ')}\n`);
}

const defaultLogger = {
    log,
    error: (...args) => log('ERROR:', ...args),
    info: log,
    warn: (...args) => log('WARN:', ...args),
    debug: log
};

module.exports = defaultLogger;
