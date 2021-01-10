const { ObjectId } = require('mongodb');
const Collection = require('./Collection');
const collections = require('./collections');

/**
 * @typedef {import('../Snapshots').SnapshotsCollection} SnapshotsCollection
 * @typedef {import('../Snapshots').Snapshot} Snapshot
 * @typedef {import('../Snapshots').ResolvedSnapshot} ResolvedSnapshot
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

    async fetchDataSource({ snapshotName, dataSourceName }) {
        /** @type {ResolvedSnapshot[]} */
        const entries = await this.collection
            .aggregate([
                {
                    $match: {
                        name: snapshotName,
                        'dataSource.name': dataSourceName,
                    },
                },
                {
                    $addFields: {
                        dataSourceId: {
                            $toObjectId: '$dataSource.id',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'dataSources.store',
                        localField: 'dataSourceId',
                        foreignField: '_id',
                        as: 'fromItems',
                    },
                },
                {
                    $project: {
                        id: '$_id',
                        name: 1,
                        query: 1,
                        filteredFilesList: 1,
                        dataSource: {
                            $arrayElemAt: ['$fromItems', 0],
                        },
                    },
                },
            ])
            .toArray();
        if (entries.length === 0) return null;
        const { dataSource, ...rest } = entries[0];
        const ds = this[Collection.stripId](dataSource);
        const snapshot = this[Collection.stripId](rest);
        return {
            ...snapshot,
            dataSource: ds,
        };
    }

    async updateFilesList({ id, filesList = [], droppedFiles = [] }) {
        const response = await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { filteredFilesList: filesList, droppedFiles } }
        );
        return response.modifiedCount === 1;
    }
}

module.exports = Snapshots;
