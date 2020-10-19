/** @typedef {import('../DataSource').DataSourcesInterface} DataSourcesInterface */

/** @implements {DataSourcesInterface} */
class DataSources {
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

module.exports = DataSources;
