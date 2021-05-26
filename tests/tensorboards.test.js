const { expect } = require('chai');
const { generateTensorboard } = require('./common');
let db = null;

describe('Tensorboards', () => {
    before(async () => {
        db = global.testParams.db;
    });
    it('should not throw error itemNotFound', async () => {
        const board = generateTensorboard();
        const response = await db.tensorboards.fetch(board);
        expect(response).to.be.null;
    });
    it('should throw conflict error', async () => {
        const board = generateTensorboard();
        await db.tensorboards.create(board);
        const promise = db.tensorboards.create(board);
        await expect(promise).to.be.rejectedWith(/could not create/i);
    });
    it('should create and fetch board', async () => {
        const board = generateTensorboard();
        const res1 = await db.tensorboards.create(board);
        const res2 = await db.tensorboards.fetch({ id: board.id });
        expect(res1).to.eql(res2);
    });
    it('should create and update board', async () => {
        const board = generateTensorboard();
        const id = board.id;
        const params = { ttl: 60 };
        await db.tensorboards.create(board);
        await db.tensorboards.update({ ...params, id });
        const res = await db.tensorboards.fetch({ id });
        expect(res).to.eql({ ...board, ...params });
    });
    it('should create and patch board', async () => {
        const board = generateTensorboard();
        const id = board.id;
        const params = { ttl: 60 };
        await db.tensorboards.create(board);
        await db.tensorboards.patch({ ...params, id });
        const res = await db.tensorboards.fetch({ id });
        const { key, ...data } = res;
        expect(data).to.eql({ ...board, ...params });
    });
    it('should create and delete board', async () => {
        const board = generateTensorboard();
        const id = board.id;
        await db.tensorboards.create(board);
        const res1 = await db.tensorboards.fetch({ id });
        const res2 = await db.tensorboards.delete({ id });
        const response = await db.tensorboards.fetch({ id });
        expect(res1).to.eql(board);
        expect(res2).to.eql({ deleted: 1 });
        expect(response).to.be.null;
    });
    it('should create and search board list', async () => {
        const board1 = generateTensorboard();
        const board2 = generateTensorboard();
        const board3 = generateTensorboard();
        const status = 'creating';
        board1.status = status;
        await db.tensorboards.create(board1);
        await db.tensorboards.create(board2);
        await db.tensorboards.create(board3);
        const list = await db.tensorboards.search({ status });
        expect(list.length).to.be.gte(1);
    });
    it('should create and fetch board list', async () => {
        const board1 = generateTensorboard();
        const board2 = generateTensorboard();
        const board3 = generateTensorboard();
        await db.tensorboards.create(board1);
        await db.tensorboards.create(board2);
        await db.tensorboards.create(board3);
        const list = await db.tensorboards.fetchAll();
        expect(list.length).to.be.gte(3);
    });
});
