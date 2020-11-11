// @ts-nocheck
const { ObjectId } = require('mongodb');
const {
    itemNotFound,
    invalidParams,
    invalidId,
    missingParam,
} = require('../errors');

const validateId = Symbol('validateId');
const stripId = Symbol('stripId');

/** @template T */
class Collection {
    /**
     * @param {import('mongodb').Db} db
     * @param {import('mongodb').MongoClient} mongoClient
     */
    constructor(db, collectionName, mongoClient) {
        /** @type {import('mongodb').Collection<T>} */
        this.collection = db.collection(collectionName);
        this.collectionName = collectionName;
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
        return { ...rest, id: _id.toHexString() };
    }

    async create({ name }) {
        const response = await this.collection.insertOne({ name });
        return { name, id: response.insertedId.toHexString() };
    }

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

    async fetch({ name = '', id = '' } = {}) {
        if (name && id) {
            throw invalidParams(
                'you need to provide only one of "name" | "id"'
            );
        }
        let entry;
        if (name)
            entry = await this.collection.findOne(
                { name },
                // return the latest by the natural order of the documents
                { sort: { $natural: -1 } }
            );
        else if (id) {
            this[validateId](id);
            entry = await this.collection.findOne({ _id: new ObjectId(id) });
        } else {
            throw missingParam('name | id');
        }
        if (entry) return this[stripId](entry);
        throw itemNotFound(this.collectionName, id);
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
