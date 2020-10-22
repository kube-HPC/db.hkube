const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

describe('dataSource', () => {
    it('should throw conflict error when name already exists', async () => {
        const db = await connect();
        const name = uuid.v4();
        const firstResponse = await db.dataSources.create(name);
        expect(firstResponse).to.be.string;
        const promise = db.dataSources.create(name);
        await expect(promise).to.be.rejectedWith(
            'could not create dataSources, name is already taken'
        );
    });
});
