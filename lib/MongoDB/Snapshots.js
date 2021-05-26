const { ObjectId } = require('mongodb');
const Collection = require('./Collection');
const collections = require('./collections');

class Snapshots extends Collection {
    constructor(db, client) {
        super(db, client, collections.Snapshots);
    }

    async fetchDataSourceWithCredentials({ snapshotName, dataSourceName }) {
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
                        droppedFiles: 1,
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

    async fetchDataSource({ snapshotName, dataSourceName }) {
        const snapshot = await this.fetchDataSourceWithCredentials({
            snapshotName,
            dataSourceName,
        });
        if (!snapshot) return snapshot;
        const { dataSource, ...rest } = snapshot;
        const { _credentials, ...dataSourceRest } = dataSource;
        return {
            ...rest,
            dataSource: dataSourceRest,
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
