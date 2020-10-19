const { expect } = require('chai');
const DB = require('./../');

describe('MongoDB', () => {
    it('should bootstrap MongoDB connection amd disconnect', async () => {
        const db = DB('MongoDB', {
            MongoDB: {
                host: 'mongodb://localhost',
                port: 27017,
            },
        });
        await db.init();
        expect(db.isConnected).to.be.true;
        await db.close();
        expect(db.isConnected).to.be.false;
    });
});
