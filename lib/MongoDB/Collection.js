// @ts-nocheck
const { ObjectId } = require('mongodb');
const {
    itemNotFound,
    invalidParams,
    invalidId,
    missingParam,
    conflict,
} = require('../errors');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');

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

    async createUniqueIndex() {
        await this.collection.createIndex(
            { [this.index]: 1 },
            { name: this.index, unique: true }
        );
    }

    [validateId](id) {
        if (!ObjectId.isValid(id)) {
            throw invalidId(id);
        }
    }

    [stripId](entry) {
        const { _id, ...rest } = entry;
        return { ...rest, id: _id.toHexString() };
    }

    async create(options) {
        try {
            await this.collection.insertOne({ ...options });
            return options;
        } catch (error) {
            if (error.code === 11000) {
                throw conflict(this.entityName, this.index);
            }
            throw error;
        }
    }

    // this need to be changed
    async delete({ name, id }, { allowNotFound = false } = {}) {
        if (name && id) {
            throw invalidParams(
                'you need to provide only one of "name" | "id"'
            );
        }
        let response;
        if (name) response = await this.collection.deleteOne({ name });
        else if (id) {
            this[validateId](id);
            response = await this.collection.deleteOne({ _id: ObjectId(id) });
        } else {
            throw missingParam('name | id');
        }
        if (response.deletedCount > 0) return name || id;
        if (allowNotFound) return null;
        throw itemNotFound(this.collectionName, name);
    }

    async fetch(options) {
        let entry;
        if (options.id) {
            this[validateId](options.id);
            entry = await this.collection.findOne({
                _id: new ObjectId(options.id),
            });
        } else {
            entry = await this.collection.findOne(
                options,
                // return the latest by the natural order of the documents
                { sort: { $natural: -1 } }
            );
        }
        if (entry) {
            return this[stripId](entry);
        }
        const searchKey = Object.values(options)[0];
        throw itemNotFound(this.collectionName, searchKey);
    }

    /**
     * @param {object} query
     * @param {?string[]} query.names
     * @param {?string[]} query.ids
     */
    async fetchMany({ names = [], ids = [] }) {
        if (names.length)
            return this.collection.find({ name: { $in: names } }).toArray();

        if (ids.length)
            return this.collection
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .toArray();

        throw missingParam('names | ids');
    }

    fetchAll() {
        return this.collection
            .find({})
            .map(entry => this[stripId](entry))
            .toArray();
    }
}

module.exports = Collection;
module.exports.stripId = stripId;
module.exports.validateId = validateId;
