const { ObjectId } = require('mongodb');
const merge = require('lodash.merge');
const cloneDeep = require('lodash.clonedeep');
const { itemNotFound, invalidId, missingParam, conflict } = require('../errors');
const { createProjection, createSortOrder } = require('./utils');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');

/** @template T */
class Collection {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} client
     * @param {import('./collections').Config} collection
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

    async _createIndex(index) {
        const { indexName, unique, ...props } = index;
        const indices = createSortOrder(props);
        await this.collection.createIndex(indices, { name: indexName, unique });
    }

    /**
     * @param {T} doc
     * @param {{ applyId?: boolean }} settings
     * @returns {Promise<T>}
     */
    async create(doc, { applyId = false } = {}) {
        try {
            const response = await this.collection.insertOne({ ...doc }, { checkKeys: false }); // to prevent mutate the doc (_id)
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
     * @param {{ ordered?: boolean; throwOnConflict?: boolean }} settings
     */
    async createMany(array, { throwOnConflict = false, ordered = false } = {}) {
        try {
            const docs = cloneDeep(array); // to prevent mutate the docs (_id)
            const result = await this.collection.insertMany(docs, { ordered });
            return { inserted: result.insertedCount };
        } catch (error) {
            if (throwOnConflict) {
                this._checkConflict(error);
                throw error;
            }
            return null;
        }
    }

    /**
     * @param {T} query
     * @param {{ queryInnerId?: boolean; allowNotFound?: boolean }} settings
     * @returns {Promise<{ deleted: number }>}
     */
    async delete(query, { queryInnerId = true, allowNotFound = true } = {}) {
        let response;
        const { id } = query;
        if (queryInnerId && id) {
            this[validateId](id);
            response = await this.collection.deleteOne({ _id: new ObjectId(id) });
        } else {
            response = await this.collection.deleteOne(query);
        }
        if (allowNotFound || response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    /**
     * @param {any} query
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
     * @param {any} query
     * @param {{
     *     fields?: object;
     *     sort?: object;
     *     allowNotFound?: boolean;
     *     queryInnerId?: boolean;
     *     excludeId?: boolean;
     * }} settings
     * @returns {Promise<T>}
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
            entry = await this.collection.findOne({ _id: new ObjectId(query.id) }, { projection });
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
     * @type {(params: { query: T; data: T; onFetch?: Function }) => Promise<T>}
     */
    async patch({ query, data, onFetch }) {
        let patchedData;
        await this.transaction(async () => {
            const entry = await this.fetch(query);
            if (onFetch) {
                patchedData = onFetch(entry);
            } else {
                patchedData = merge({}, entry, data);
            }
            await this.updateOne({
                filter: query,
                query: { $set: patchedData },
            });
        });
        return patchedData;
    }

    async updateOne({ filter, query, upsert = false }) {
        const result = await this.collection.updateOne(filter, query, { upsert });
        return result;
    }

    async updateMany({ filter, query, upsert = false }) {
        const result = await this.collection.updateMany(filter, query, { upsert });
        return result;
    }

    async transaction(func) {
        const session = this._client.startSession();
        try {
            await session.withTransaction(async opt => {
                await func(opt);
            });
        } finally {
            session.endSession();
        }
    }

    /**
     * @param {{ names?: string[]; ids?: string[] }} query
     * @param {{ fields?: object; excludeId?: boolean }} settings
     */
    async fetchMany({ names = [], ids = [] }, { fields = {}, excludeId = false } = {}) {
        const projection = createProjection(fields, excludeId);
        if (names.length)
            return this.collection
                .find({ name: { $in: names } })
                .project(projection)
                .toArray();

        if (ids.length)
            return this.collection
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .project(projection)
                .toArray();

        throw missingParam('names | ids');
    }

    /**
     * @type {(params: {
     *     query?: object;
     *     fields?: object;
     *     excludeId?: boolean;
     *     sort?: object;
     *     limit?: number;
     * }) => Promise<T[]>}
     */
    fetchAll({ query = {}, fields = {}, excludeId = false, sort = null, limit = 0 } = {}) {
        const projection = createProjection(fields, excludeId);
        const sortParams = createSortOrder(sort);
        const sizeLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

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
            const key = (error.keyPattern && Object.keys(error.keyPattern)[0]) || '';
            throw conflict(this.entityName, key);
        }
    }
}

module.exports = Collection;
module.exports.stripId = stripId;
module.exports.validateId = validateId;
