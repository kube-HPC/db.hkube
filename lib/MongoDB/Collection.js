const { ObjectId } = require('mongodb');
const merge = require('lodash.merge');
const cloneDeep = require('lodash.clonedeep');
const {
    itemNotFound,
    invalidId,
    missingParam,
    conflict,
} = require('../errors');
const { createProjection, createSortOrder } = require('./utils');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');

/** @template T */
class Collection {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     * @param {import('./collections').CollectionConfig} collection
     */
    constructor(db, client, collection) {
        this.indices = collection.indices;
        this.entityName = collection.entityName;
        /** @type {import('mongodb').Collection<T>} */
        this.collection = db.collection(collection.name);
        this._client = client;
    }

    [validateId](id) {
        if (!ObjectId.isValid(id)) {
            throw invalidId(id);
        }
    }

    [stripId](entry) {
        const { _id, ...rest } = entry;
        if (_id) {
            return { ...rest, id: _id.toHexString() };
        }
        return rest;
    }

    async init() {
        if (this.indices) {
            await Promise.all(this.indices.map(i => this._createIndex(i)));
        }
    }

    /** @param {import('./collections').Index} index */
    async _createIndex(index) {
        const { indexName, unique, ...props } = index;
        const indices = createSortOrder(props);
        await this.collection.createIndex(indices, { name: indexName, unique });
    }

    /**
     * @param {T} doc
     * @param {{ applyId?: boolean; checkKeys?: boolean }} settings
     * @returns {Promise<T>}
     */
    async create(doc, { applyId = false, checkKeys = false } = {}) {
        try {
            // to prevent mutating the doc (_id)
            const response = await this.collection.insertOne(
                // @ts-ignore
                { ...doc },
                { checkKeys }
            );
            if (applyId) {
                return { ...doc, id: response.insertedId.toHexString() };
            }
            return doc;
        } catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    /**
     * @param {T[]} array
     * @param {{
     *     ordered?: boolean;
     *     throwOnConflict?: boolean;
     *     returnDocs?: boolean;
     *     checkKeys?: boolean;
     * }} settings
     */
    async createMany(
        array,
        {
            throwOnConflict = false,
            ordered = false,
            returnDocs = false,
            checkKeys = false,
        } = {}
    ) {
        try {
            const docs = cloneDeep(array); // to prevent mutating the docs (_id)
            // @ts-ignore
            const result = await this.collection.insertMany(docs, {
                ordered,
                checkKeys,
            });
            return {
                inserted: result.insertedCount,
                ...(returnDocs
                    ? {
                          docs: docs.map(entry => ({
                              ...entry,
                              // @ts-ignore
                              id: entry._id.toHexString(),
                          })),
                      }
                    : {}),
            };
        } catch (error) {
            if (throwOnConflict) {
                this._checkConflict(error);
                throw error;
            }
            return null;
        }
    }

    /**
     * @param {Partial<T>} query
     * @param {{ queryInnerId?: boolean; allowNotFound?: boolean }} settings
     * @returns {Promise<{ deleted: number }>}
     */
    async delete(query, { queryInnerId = true, allowNotFound = true } = {}) {
        let response;
        // @ts-ignore
        const { id } = query;
        if (queryInnerId && id) {
            this[validateId](id);
            // @ts-ignore
            response = await this.collection.deleteOne({
                _id: new ObjectId(id),
            });
        } else {
            response = await this.collection.deleteMany(query);
        }
        if (allowNotFound || response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    /**
     * @param {Partial<T>} query
     * @param {{ allowNotFound?: boolean }} settings
     * @returns {Promise<{ deleted: number }>}
     */
    async deleteMany(query, { allowNotFound = false } = {}) {
        const response = await this.collection.deleteMany(query);
        if (allowNotFound || response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    /**
     * @param {Partial<T>} query
     * @param {{
     *     fields?: Partial<T>;
     *     sort?: Partial<T> | null;
     *     allowNotFound?: boolean;
     *     queryInnerId?: boolean;
     *     excludeId?: boolean;
     * }} settings
     * @returns {Promise<T | null>}
     */
    async fetch(
        query,
        {
            fields = {},
            sort = null,
            allowNotFound = true,
            queryInnerId = true,
            excludeId = false,
        } = {}
    ) {
        let entry;
        const projection = createProjection(fields, excludeId);
        const sortParams = createSortOrder(sort);
        if (queryInnerId && query.id) {
            this[validateId](query.id);
            entry = await this.collection.findOne(
                // @ts-ignore
                { _id: new ObjectId(query.id) },
                { projection }
            );
        } else {
            entry = await this.collection.findOne(query, {
                sort: sortParams || { $natural: -1 }, // return the latest by the natural order of the documents
                projection,
            });
        }
        if (entry) {
            return this[stripId](entry);
        }
        if (allowNotFound) {
            return null;
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    /**
     * This method do partial update
     *
     * @type {(params: {
     *     query: Partial<T>;
     *     data?: Partial<T>;
     *     handleUpdate?: Function;
     * }) => Promise<T>}
     */
    async patch({ query, data, handleUpdate }) {
        let patchedData;
        await this.transaction(async () => {
            const entry = await this.fetch(query);
            if (handleUpdate) {
                patchedData = handleUpdate(entry);
            } else {
                patchedData = merge({}, entry, data);
            }
            await this.updateOne({
                filter: query,
                query: { $set: patchedData },
                upsert: true,
            });
        });
        return patchedData;
    }

    async updateOne({
        filter,
        query,
        session,
        upsert = false,
        checkKeys = false,
    }) {
        const result = await this.collection.updateOne(filter, query, {
            upsert,
            checkKeys,
            session,
        });
        return result;
    }

    async replaceOne({
        filter,
        replacement,
        upsert = false,
        checkKeys = false,
    }) {
        const result = await this.collection.replaceOne(filter, replacement, {
            upsert,
            checkKeys,
        });
        return result;
    }

    async updateMany({ filter, query, upsert = false }) {
        const result = await this.collection.updateMany(filter, query, {
            upsert,
        });
        return { modified: result.modifiedCount };
    }

    /**
     * @param {Function} func
     * @returns {Promise<any>}
     */
    async transaction(func) {
        let response = null;
        const transactionOptions = {
            readPreference: 'primary',
            readConcern: { level: 'local' },
            writeConcern: { w: 'majority' },
        };

        const startSession = this._client.startSession();
        try {
            await startSession.withTransaction(async session => {
                response = await func(session);
            }, transactionOptions);
        } finally {
            startSession.endSession();
        }
        return response;
    }

    /**
     * @param {{ names?: string[]; ids?: string[] }} query
     * @param {{ fields?: object; excludeId?: boolean }} settings
     */
    async fetchMany(
        { names = [], ids = [] },
        { fields = {}, excludeId = false } = {}
    ) {
        const projection = createProjection(fields, excludeId);
        if (names.length)
            return this.collection
                .find({ name: { $in: names } })
                .project(projection)
                .map(entry => this[stripId](entry))
                .toArray();

        if (ids.length)
            return this.collection
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .project(projection)
                .map(entry => this[stripId](entry))
                .toArray();

        throw missingParam('names | ids');
    }

    /**
     * @type {(params: {
     *     query?: Partial<T>;
     *     fields?: Partial<Record<keyof T, 0 | 1>>;
     *     excludeId?: boolean;
     *     sort?: Partial<T>;
     *     limit?: number;
     * }) => Promise<T[]>}
     */
    fetchAll({
        query = {},
        fields = {},
        excludeId = false,
        sort = null,
        limit = 0,
    } = {}) {
        const projection = createProjection(fields, excludeId);
        const sortParams = createSortOrder(sort);
        const sizeLimit =
            typeof limit === 'string' ? parseInt(limit, 10) : limit;

        return this.collection
            .find(query)
            .sort(sortParams)
            .limit(sizeLimit)
            .project(projection)
            .map(entry => this[stripId](entry))
            .toArray();
    }

    count({ query = {} } = {}) {
        return this.collection.find(query).count();
    }

    _checkConflict(error) {
        if (error.code === 11000) {
            const key =
                (error.keyPattern && Object.keys(error.keyPattern)[0]) || '';
            throw conflict(this.entityName, key);
        }
    }
}

module.exports = Collection;
module.exports.stripId = stripId;
module.exports.validateId = validateId;
