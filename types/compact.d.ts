export = compact;
/**
 * @param {Db} db
 * @param {string} dbUrl
 * @param {string} dbName
 * @param {any} log
 * @returns {Promise<{bytesFreed: number}>}
 */
declare function compact(db: Db, dbUrl: string, dbName: string, log?: any): Promise<{
    bytesFreed: number;
}>;
declare namespace compact {
    export { compactNode, getCompactableCollections, getReplicaSetNodes, Db };
}
/**
 * Compacts all collections on a given replica set node
 *
 * @param {object} props
 * @param {string} props.nodeUrl
 * @param {boolean} [props.force]
 * @param {string} props.dbUrl
 * @param {string} props.dbName
 * @param {string[]} props.collections
 * @param {any} props.log
 * @returns {Promise<{bytesFreed:number}>}
 */
declare function compactNode({ nodeUrl, collections, force, dbUrl, dbName, log }: {
    nodeUrl: string;
    force?: boolean;
    dbUrl: string;
    dbName: string;
    collections: string[];
    log: any;
}): Promise<{
    bytesFreed: number;
}>;
/** @typedef {import('mongodb').Db} Db */
/**
 * @param {Db} db
 * @returns {Promise<string[]>}
 */
declare function getCompactableCollections(db: Db): Promise<string[]>;
/**
 * Returns host addresses of replica set nodes
 *
 * @param {Db} db
 * @returns {Promise<{primary: string, secondaries: string[]}>}
 */
declare function getReplicaSetNodes(db: Db): Promise<{
    primary: string;
    secondaries: string[];
}>;
type Db = import("mongodb").Db;
