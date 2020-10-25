// @ts-nocheck
const { ObjectId } = require('mongodb');
const {
    itemNotFound,
    invalidParams,
    invalidId,
    missingParam,
} = require('../errors');

/** @template T */
class Collection {
    /** @param {import('mongodb').Collection<T>} collection */
    constructor(collection) {
        this.collection = collection;
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);
        this.fetch = this.fetch.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
    }

    static stripID(entry) {
        const { _id, ...rest } = entry;
        return { ...rest, id: _id };
    }

    async create(name) {
        const response = await this.collection.insertOne({ name });
        return { name, id: response.insertedId.toHexString() };
    }

    async delete(id) {
        if (!id) {
            throw missingParam('id');
        }
        if (!ObjectId.isValid(id)) {
            throw invalidId(id);
        }
        const response = await this.collection.deleteOne({
            _id: new ObjectId(id),
        });
        if (response.deletedCount > 0) return id;
        throw itemNotFound('dataSource', id);
        // return response.deletedCount > 0 ? id : null;
    }

    async fetch({ name = '', id = '' } = {}) {
        if (name && id) {
            throw invalidParams('you nee to provide only one of "name" | "id"');
        }
        if (!name && !id) {
            throw missingParam('name | id');
        }
        if (id && !ObjectId.isValid(id)) {
            throw invalidId(id);
        }
        const entry = await (id
            ? this.collection.findOne({ _id: new ObjectId(id) })
            : this.collection.findOne({ name }));
        if (entry) return Collection.stripID(entry);
        throw itemNotFound('dataSource', id);
    }

    fetchAll() {
        return this.collection.find({}).map(Collection.stripID).toArray();
    }
}

module.exports = Collection;
