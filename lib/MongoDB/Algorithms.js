/**
 * @typedef {import('./../Algorithm').AlgorithmsInterface} AlgorithmsInterface
 * @typedef {import('../Algorithm').Algorithm} Algorithm
 */

/** @implements {AlgorithmsInterface} */
class Algorithms {
    /** @param {import('mongodb').Collection<Algorithm>} collection */
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
}

module.exports = Algorithms;
