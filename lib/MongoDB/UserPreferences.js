const Collection = require('./Collection');
const collections = require('./collections');

class UserPreferences extends Collection {
    constructor(db, client) {
        super(db, client, collections.UserPreferences);
    }

    async fetch({ userId }) {
        const entry = await super.fetch({ userId }, { excludeId: true });
        return entry;
    }

    async replace(doc) {
        await super.replaceOne({
            filter: { userId: doc.userId },
            replacement: doc,
            upsert: true,
        });
        return doc;
    }

    async delete({ userId }) {
        const result = await super.delete({ userId });
        return result;
    }
}

module.exports = UserPreferences;
