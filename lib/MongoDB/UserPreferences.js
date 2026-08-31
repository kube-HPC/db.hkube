const Collection = require('./Collection');
const collections = require('./collections');

class UserPreferences extends Collection {
    constructor(db, client) {
        super(db, client, collections.UserPreferences);
    }

    async fetch({ userName }) {
        const entry = await super.fetch({ userName }, { excludeId: true });
        return entry;
    }

    async replace(doc) {
        await super.replaceOne({
            filter: { userName: doc.userName },
            replacement: doc,
            upsert: true,
        });
        return doc;
    }

    async delete({ userName }) {
        const result = await super.delete({ userName });
        return result;
    }
}

module.exports = UserPreferences;
