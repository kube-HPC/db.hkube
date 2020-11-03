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
        return { ...rest, id: _id.toHexString() };
    }

    async create(name) {
        const response = await this.collection.insertOne({ name });
        return { name, id: response.insertedId.toHexString() };
    }

    async delete({ name, id }, { allowNotFound = false } = {}) {
        if (name && id) {
            throw invalidParams(
                'you need to provide only one of "name" | "id"'
            );
        }
        if (!name && !id) {
            throw missingParam('name | id');
        }
        if (id && !ObjectId.isValid(id)) {
            throw invalidId(id);
        }
        const response = await (id
            ? this.collection.deleteOne({ _id: ObjectId(id) })
            : this.collection.deleteOne({ name }));
        if (response.deletedCount > 0) return name || id;
        if (allowNotFound) return null;
        throw itemNotFound('dataSource', name);
    }

    async fetch({ name = '', id = '' } = {}) {
        if (name && id) {
            throw invalidParams(
                'you need to provide only one of "name" | "id"'
            );
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

    /**
     * @param {object} query
     * @param {?string[]} query.names
     * @param {?string[]} query.ids
     */
    async fetchMany({ names = [], ids = [] }) {
        if (names.length > 0) {
            return this.collection.find({ name: { $in: names } }).toArray();
        }
        if (ids.length) {
            return this.collection
                .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
                .toArray();
        }
        throw missingParam('names | ids');
    }

    fetchAll() {
        return this.collection.find({}).map(Collection.stripID).toArray();
    }
}

module.exports = Collection;
