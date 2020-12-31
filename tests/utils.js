const { dummyFile } = require('./mocks');
const uuid = require('uuid').v4;

const generateEntries = amount => {
    const names = new Array(amount).fill(0).map(() => uuid());
    return {
        names,
        entries: names.map(name => ({ name, files: [dummyFile] })),
    };
};

module.exports.generateEntries = generateEntries;
