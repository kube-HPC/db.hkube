/**
 * @typedef {import('../Pipeline').PipelinesInterface} PipelinesInterface
 * @typedef {import('../Pipeline').Pipeline} Pipeline
 */

/** @implements {PipelinesInterface} */
class Pipelines {
    /** @param {import('mongodb').Collection<Pipeline>} collection */
    constructor(collection) {
        this.collection = collection;
    }

    create() {
        return null;
    }

    delete() {
        return null;
    }

    fetch({ name, id }) {
        if (!name && !id) {
            throw new Error('you did not provide a name or id to fetch');
        }
        return this.collection.findOne({ name, id });
    }

    fetchAll() {
        return this.collection.find({}).toArray();
    }

    edit() {
        return null;
    }
}

module.exports = Pipelines;
