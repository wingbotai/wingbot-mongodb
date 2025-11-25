'use strict';

declare namespace wingbotmongodb {

    type Collection<T> = import('mongodb').Collection<T>;
    type Db = import('mongodb').Db;
    type CreateIndexesOptions = import('mongodb').CreateIndexesOptions;
    type ObjectId = import('mongodb').ObjectId;

    export class BaseStorage<T = {}> {

        constructor (mongoDb: Db|{():Promise<Db>}, collectionName: string, log?: {error:Function, log:Function}, isCosmo?: boolean)

        _getCollection (forRead?: boolean): Promise<Collection<T>>

        public addFixtureDoc (...any: any)

        public addIndex (index: object, options: CreateIndexesOptions)

        protected _id (id: string): ObjectId

        protected _expandObjectToSet (attr: string|null, obj: {[key: string]: any}, nested?: boolean): {[key: string]: any}

        protected _log: { log: Function, error: Function };

        public preHeat(): Promise<void>

        public drop (): Promise<void>
    }

}
