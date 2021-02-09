const { dummyFile } = require('./mocks');
const uuid = require('uuid').v4;
/** @typedef {import('../lib/DataSource').FileMeta} FileMeta */

const generateEntries = amount => {
    const names = new Array(amount).fill(0).map(() => uuid());
    return {
        names,
        entries: names.map(name => ({
            name,
            files: [dummyFile],
            git: null,
            storage: null,
        })),
    };
};

/** @type {(amount?: number) => FileMeta[]} */
const generateMockFiles = (amount = 4) =>
    new Array(amount).fill(0).map((file, ii) => ({
        id: `file-${ii}`,
        name: `file-${ii}-${uuid()}`,
        path: `path-${ii}`,
        size: 1,
        type: Math.random() > 0.5 ? 'csv' : 'md',
        uploadedAt: new Date().getTime(),
    }));

module.exports.generateEntries = generateEntries;
module.exports.generateMockFiles = generateMockFiles;
