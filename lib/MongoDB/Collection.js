const { ObjectId } = require('mongodb');
const merge = require('lodash.merge');
const cloneDeep = require('lodash.clonedeep');
const now = require('performance-now');
const { itemNotFound, invalidId, missingParam, conflict, } = require('../errors');
const { createProjection, createSortOrder, sortOrderCursor } = require('./utils');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');
const removeId = Symbol('removeId');

class Collection {
    constructor(db, client, collection) {
        this.indices = collection.indices;
        this.entityName = collection.entityName;
        this.collection = db.collection(collection.name);
        this._client = client;
        this._watchMap = new Map();
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

    [removeId](entry) {
        const { id, ...rest } = entry;
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

    async create(doc, { applyId = false, checkKeys = false } = {}) {
        try {
            // to prevent mutating the doc (_id)
            const response = await this.collection.insertOne(
                { ...doc },
                { checkKeys }
            );
            if (applyId) {
                return { ...doc, id: response.insertedId.toHexString() };
            }
            return doc;
        }
        catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    async createOrReplaceMany(
        idFieldName,
        array,
        {
            throwOnConflict = false,
            returnDocs = false,
        } = {}
    ) {
        try {
            const data = array.map(doc => {
                const filter = {};
                filter[idFieldName] = doc[idFieldName];
                const bulkPart = { replaceOne: { filter, replacement: doc, upsert: true, hint: idFieldName } };
                return bulkPart;
            });
            const docs = cloneDeep(array); // to prevent mutating the docs (_id)
            const result = await this.collection.bulkWrite(data);
            return {
                inserted: result.insertedCount,
                ...(returnDocs
                    ? {
                        docs: docs.map(entry => ({
                            ...entry,
                            id: entry._id.toHexString(),
                        })),
                    }
                    : {}),
            };
        }
        catch (error) {
            if (throwOnConflict) {
                this._checkConflict(error);
                throw error;
            }
            return null;
        }
    }

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
                            id: entry._id.toHexString(),
                        })),
                    }
                    : {}),
            };
        }
        catch (error) {
            if (throwOnConflict) {
                this._checkConflict(error);
                throw error;
            }
            return null;
        }
    }

    async delete(query, { queryInnerId = true, allowNotFound = true } = {}) {
        let response;
        const { id } = query;
        if (queryInnerId && id) {
            this[validateId](id);
            response = await this.collection.deleteOne({ _id: new ObjectId(id) });
        }
        else {
            response = await this.collection.deleteOne(query);
        }
        if (allowNotFound || response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    async deleteMany(query, { allowNotFound = false } = {}) {
        const response = await this.collection.deleteMany(query);
        if (allowNotFound || response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

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
                { _id: new ObjectId(query.id) },
                { projection }
            );
        }
        else {
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

    async patch({ query, data, handleUpdate }) {
        let patchedData;
        await this.transaction(async () => {
            const entry = await this.fetch(query);
            if (handleUpdate) {
                patchedData = handleUpdate(entry);
            }
            else {
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

    async watch(pipeline, cb) {
        const options = { fullDocument: 'updateLookup' };
        const watchCursor = await this.collection.watch(pipeline, options);
        watchCursor.on('change', (doc) => {
            cb(doc);
        });
        return watchCursor;
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
        const result = await this.collection.updateMany(filter, query, { upsert });
        return {
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        };
    }

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
        }
        finally {
            startSession.endSession();
        }
        return response;
    }

    async fetchMany(
        { names = [], ids = [] },
        { fields = {}, excludeId = false } = {}
    ) {
        const projection = createProjection(fields, excludeId);
        if (names.length) {
            return this.collection
                .find({ name: { $in: names } }, { allowDiskUse: true })
                .project(projection)
                .map(entry => this[stripId](entry))
                .toArray();
        }
        if (ids.length) {
            return this.collection
                .find(
                    { _id: { $in: ids.map(id => new ObjectId(id)) } },
                    { allowDiskUse: true }
                )
                .project(projection)
                .map(entry => this[stripId](entry))
                .toArray();
        }

        throw missingParam('names | ids');
    }

    fetchAll({
        query = {},
        fields = {},
        excludeId = false,
        sort = null,
        skip = 0,
        limit = 0,
    } = {}) {
        const projection = createProjection(fields, excludeId);
        const sortParams = createSortOrder(sort);
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        const skipNum = typeof skip === 'string' ? parseInt(skip, 10) : skip;

        return this.collection
            .find(query, { allowDiskUse: true })
            .sort(sortParams)
            .skip(skipNum)
            .limit(limitNum)
            .project(projection)
            .map(entry => this[stripId](entry))
            .toArray();
    }

    async searchApi({
        query,
        cursor,
        pageNum,
        limit,
        sort = 'desc',
        fields,
        exists,
    }) {
        let skip = 0;
        let newQuery = query;

        if (cursor) {
            if (!ObjectId.isValid(cursor)) {
                throw new Error('please provide a valid cursor');
            }
            newQuery = cloneDeep(query);
            const so = sortOrderCursor[sort];
            newQuery._id = { [so]: new ObjectId(cursor) };
        }
        else if (pageNum > 0) {
            skip = (pageNum - 1) * limit;
        }

        const newSort = {
            _id: sort
        };

        const start = now();
        const results = await this.fetchAll({
            query: newQuery,
            sort: newSort,
            skip,
            limit,
            fields,
            exists,
            excludeId: false
        });
        const end = now();
        const diff = (end - start).toFixed(2);
        const timeTook = `${diff}ms`;
        const hits = results.map(r => this[removeId](r));
        const nextCursor = this._findNextCursor(results);
        const response = {
            hits,
            cursor: nextCursor,
            timeTook,
        };
        return response;
    }

    count({ query = {} } = {}) {
        return this.collection.find(query, { allowDiskUse: true }).count();
    }

    _findNextCursor(results) {
        let cursor;
        if (results?.length) {
            cursor = results[results.length - 1].id;
        }
        return cursor;
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
