/** @typedef {import('./../Algorithm').AlgorithmsInterface} AlgorithmsInterface */

/** @implements {AlgorithmsInterface} */
class Algorithms {
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
        return null;
    }

    edit() {
        return null;
    }
}

module.exports = Algorithms;
