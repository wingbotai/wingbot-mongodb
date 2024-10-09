/**
 * @author David Menger
 */
'use strict';

/**
 *
 * @param {any} obj
 * @param {boolean} nested
 * @param {string} [attr]
 * @param {object} [ret]
 * @returns {object}
 */
function getNestedObjects (obj, nested, attr = null, ret = {}) {
    if (typeof obj !== 'object' || !obj || nested === null || Array.isArray(obj)) {
        Object.assign(ret, { [attr]: obj === undefined ? null : obj });
    } else {
        Object.entries(obj)
            .forEach(([key, val]) => {
                getNestedObjects(val, nested || null, attr ? `${attr}.${key}` : key, ret);
            });
    }
    return ret;
}

module.exports = getNestedObjects;
