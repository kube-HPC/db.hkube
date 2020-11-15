const { dummyFile } = require('./mocks');
const uuid = require('uuid');

const generateEntries = amount => {
    const names = new Array(amount).fill(0).map(() => uuid.v4());
    return {
        names,
        entries: names.map(name => ({ name, files: [dummyFile] })),
    };
};

module.exports.generateEntries = generateEntries;
