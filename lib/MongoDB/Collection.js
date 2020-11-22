// @ts-nocheck
const { ObjectId } = require('mongodb');
const {
    itemNotFound,
    invalidId,
    missingParam,
    conflict,
} = require('../errors');
const { includedMap, excludedMap } = require('./utils');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');
const removeId = Symbol('removeId');

/** @template T */
class Collection {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} mongoClient
     */
    constructor(db, mongoClient, collection) {
        /** @type {import('mongodb').Collection<T>} */
        this.index = collection.index;
        this.entityName = collection.name;
        this.collectionName = `${collection.name}s`; // make it plural
        this.collection = db.collection(this.collectionName);
        this._client = mongoClient;
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);
        this.fetch = this.fetch.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
        this.fetchMany = this.fetchMany.bind(this);
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
        const { _id, ...rest } = entry;
        return rest;
    }

    async createUniqueIndex() {
        await this.collection.createIndex(
            { [this.index]: 1 },
            { name: this.index, unique: true }
        );
    }

    async create(options) {
        try {
            /**
             * We can use index and generated _id `createUniqueIndex`
             *
             * OR
             *
             * We can set manually the _id `const _id = options[this.index];`
             * await this.collection.insertOne({ _id, ...options });
             */

            await this.collection.insertOne({ ...options });
            return options;
        } catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    async createMany(options, settings = { ordered: false }) {
        try {
            const result = await this.collection.insertMany(options, settings);
            return result.insertedCount;
        } catch (error) {
            this._checkConflict(error);
            throw error;
        }
    }

    async delete(options, { allowNotFound = false } = {}) {
        let response;
        const { id } = options;
        if (id) {
            this[validateId](id);
            response = await this.collection.deleteOne({ _id: ObjectId(id) });
        } else {
            response = await this.collection.deleteOne(options);
        }
        const searchKey = Object.values(options)[0];
        if (response.deletedCount > 0) {
            return searchKey;
        }
        if (allowNotFound) {
            return null;
        }
        throw itemNotFound(this.collectionName, searchKey);
    }

    async fetch(options, projection = {}) {
        let entry;
        if (options.id) {
            this[validateId](options.id);
            entry = await this.collection.findOne({
                _id: new ObjectId(options.id),
            });
        } else {
            entry = await this.collection.findOne(
                { ...options },
                {
                    sort: { $natural: -1 }, // return the latest by the natural order of the documents
                    projection: { ...projection },
                }
            );
        }
        if (entry) {
            return this[stripId](entry);
        }
        const searchKey = Object.values(options)[0];
        throw itemNotFound(this.collectionName, searchKey);
    }

    async updateOne(filter, query) {
        return this.collection.updateOne(filter, query, { upsert: true });
    }

    async updateMany(filter, query) {
        return this.collection.updateMany(filter, query, { upsert: true });
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
     */
    async fetchMany({ names = [], ids = [] }, projection = {}) {
        if (names.length)
            return this.collection
                .find({ name: { $in: names } })
                .project({ ...projection })
                .toArray();

        if (ids.length)
            return this.collection
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .project({ ...projection })
                .toArray();

        throw missingParam('names | ids');
    }

    fetchAll(query = {}, { included, excluded } = {}) {
        const includedFields = includedMap(included);
        const excludedFields = excludedMap(excluded);

        return this.collection
            .find(query)
            .project({ ...excludedFields, ...includedFields })
            .map(entry => this[stripId](entry))
            .toArray();
    }

    _checkConflict(error) {
        if (error.code === 11000) {
            throw conflict(this.entityName, this.index);
        }
    }
}

module.exports = Collection;
module.exports.stripId = stripId;
module.exports.removeId = removeId;
module.exports.validateId = validateId;
