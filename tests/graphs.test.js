const { expect } = require('chai');
const uuid = require('uuid');
const connect = require('./connect');

const generateGraph = () => ({
    jobId: `jobId-${uuid.v4()}`,
    timestamp: Date.now(),
    nodes: [
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: "green-alg",
            input: [1, 2, true, "@data", "#@data", { obj: 'prop' }],

        },
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: "green-alg",
            input: [1, 2, true, "@green", "#@data", { obj: 'prop' }],
        },
        {
            nodeName: `node-${uuid.v4()}`,
            algorithmName: "green-alg",
            input: [1, 2, true, "@yellow", "#@data", { obj: 'prop' }],
        }
    ],
    edges: [
        {
            from: "green",
            to: "yellow",
            value: {
                types: ["waitNode", "input"]
            }
        },
        {
            from: "yellow",
            to: "black",
            value: {
                types: ["waitNode", "input"]
            }
        }
    ],
})

describe('Graphs', () => {
    xit('should throw conflict error when graph already exists', async () => {
        const db = await connect();
        const graph = generateGraph();
        await db.graphs.create(graph);
        const promise = db.graphs.create(graph);
        await expect(promise).to.be.rejectedWith('could not create graph, jobId is already taken');
    });
    xit('should create and fetch graph', async () => {
        const db = await connect();
        const graph = generateGraph();
        const res1 = await db.graphs.create(graph);
        const res2 = await db.graphs.fetch({ jobId: graph.jobId });
        expect(res1).to.eql(res2);
    });
    xit('should create and update graph', async () => {
        const db = await connect();
        const graph1 = generateGraph();
        const graph2 = generateGraph();
        const jobId = graph1.jobId;
        await db.graphs.create(graph1);
        await db.graphs.update({ ...graph2, jobId });
        const res2 = await db.graphs.fetch({ jobId });
        expect(res2).to.eql(graph2);
    });
    xit('should create and fetch graph list', async () => {
        const db = await connect();
        const graph1 = generateGraph();
        const graph2 = generateGraph();
        const graph3 = generateGraph();
        await db.graphs.create(graph1);
        await db.graphs.create(graph2);
        await db.graphs.create(graph3);
        const list = await db.graphs.fetchAll();
        expect(list.length).to.be.greaterThan(3)
    });
});
