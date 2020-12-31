const Collection = require('./Collection');
const collections = require('./collections');

/**
 * @typedef {import('../Snapshots').SnapshotsCollection} SnapshotsCollection
 * @typedef {import('../Snapshots').Snapshot} Snapshot
 * @typedef {import('./Collection').Collection} Collection
 */

/**
 * @augments {Collection<Snapshot>}
 * @implements {SnapshotsCollection}
 */
class Snapshots extends Collection {
    constructor(db, client) {
        super(db, client, collections.Snapshots);
    }
}

module.exports = Snapshots;
