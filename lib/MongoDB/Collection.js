const { ObjectId } = require('mongodb');
const merge = require('lodash.merge');
const { itemNotFound, invalidId, missingParam, conflict } = require('../errors');
const { createProjection, sortMap } = require('./utils');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');

/** @template T */
class Collection {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} mongoClient
     * @param {import('../const/collections').MongoClient} collection
     */
    constructor(db, mongoClient, collection) {
        /** @type {import('mongodb').Collection<T>} */
        this.index = collection.index;
        this.entityName = collection.entityName;
        this.collection = db.collection(collection.name);
        this._client = mongoClient;
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
        if (this.index) {
            await this._createUniqueIndex(this.index);
        }
    }

    async _createUniqueIndex({ name, unique }) {
        await this.collection.createIndex({ [name]: 1 }, { name, unique });
    }

    async create(options, { applyId = false } = {}) {
        try {
            const response = await this.collection.insertOne({ ...options });
            if (applyId) {
                return { ...options, id: response.insertedId.toHexString() };
            }
            return options;
        } catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    async createMany(options, { ordered = false } = {}) {
        try {
            const result = await this.collection.insertMany(options, { ordered });
            return { inserted: result.insertedCount };
        } catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    async delete(options, { queryInnerId = true, allowNotFound = false } = {}) {
        let response;
        const { id } = options;
        if (queryInnerId && id) {
            this[validateId](id);
            response = await this.collection.deleteOne({ _id: ObjectId(id) });
        } else {
            response = await this.collection.deleteOne(options);
        }
        if (response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        if (allowNotFound) {
            return null;
        }
        const searchKey = Object.values(options)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    async deleteMany(options, { allowNotFound = false } = {}) {
        const response = await this.collection.deleteMany(options);
        if (response.deletedCount > 0) {
            return { deleted: response.deletedCount };
        }
        if (allowNotFound) {
            return null;
        }
        const searchKey = Object.values(options)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    async fetch(query, { fields, queryInnerId = true, excludeId = false } = {}) {
        let entry;
        const projection = createProjection(fields, excludeId);

        if (queryInnerId && query.id) {
            this[validateId](query.id);
            entry = await this.collection.findOne({ _id: new ObjectId(query.id) }, { projection });
        } else {
            entry = await this.collection.findOne(query, {
                sort: { $natural: -1 }, // return the latest by the natural order of the documents
                projection,
            });
        }
        if (entry) {
            return this[stripId](entry);
        }
        const searchKey = Object.values(query)[0];
        throw itemNotFound(this.entityName, searchKey);
    }

    // is it the right way to do partial update?
    // the standard update will override the entire nested object.
    // I can do something like
    // { $set: { "object1.$.field1: val }"
    // { $set: { "object2.$.field2: val }"
    // but I don't want flat the object.....
    async patch({ query, data, onFetch }) {
        let patchedData;
        await this.transaction(async () => {
            const entry = await this.fetch(query);
            if (onFetch) {
                patchedData = onFetch(entry);
            } else {
                patchedData = merge({}, entry, data);
            }
            await this.update(patchedData);
        });
        return patchedData;
    }

    async updateOne({ filter, query, upsert = false }) {
        return this.collection.updateOne(filter, query, { upsert });
    }

    async updateMany({ filter, query, upsert = false }) {
        return this.collection.updateMany(filter, query, { upsert });
    }

    // @reggev try this....
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
     * @param {object} query
     * @param {?string[]} query.names
     * @param {?string[]} query.ids
     * @param {object} options.fields
     * @param {object} options.excludeId
     */
    async fetchMany({ names = [], ids = [] }, { fields, excludeId = false } = {}) {
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

    fetchAll({ query = {}, fields, excludeId = false, sort, limit = 0 } = {}) {
        const projection = createProjection(fields, excludeId);
        const sortParams = sortMap(sort);

        return this.collection
            .find(query)
            .sort(sortParams)
            .limit(limit)
            .project(projection)
            .map(entry => this[stripId](entry))
            .toArray();
    }

    count({ query = {} }) {
        return this.collection.find(query).count();
    }

    _checkConflict(error) {
        if (error.code === 11000) {
            throw conflict(this.entityName, this.index.name);
        }
    }
}

module.exports = Collection;
module.exports.stripId = stripId;
module.exports.validateId = validateId;
