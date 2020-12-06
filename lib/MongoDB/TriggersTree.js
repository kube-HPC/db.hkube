const Collection = require('./Collection');
const collections = require('./collections');

class TriggersTree extends Collection {
    constructor(db, client) {
        super(db, client, collections.TensorBoards);
    }

    async fetch({ id }) {
        const entry = await super.fetch(
            { id },
            {
                queryInnerId: false,
                excludeId: true,
            }
        );
        return entry;
    }

    async update(options) {
        const { name, rootJobName, jobId, rootJobId, parentJobId } = options;

        await super.transaction(async () => {
            let tree = await super.fetch({ jobId: rootJobId });
            if (!tree) {
                tree = this.createNode(rootJobName, rootJobId);
            }
            if (parentJobId) {
                const node = this.traverse(tree, parentJobId);
                node.children.push(this.createNode(name, jobId));
            }
            await super.updateOne({
                filter: { jobId: rootJobId },
                query: { $set: tree },
            });
        });
        return options;
    }

    traverse(current, parent) {
        if (current.jobId === parent) {
            return current;
        }
        if (current.children.length > 0) {
            let i = 0;
            let node = null;
            while (i < current.children.length && !node) {
                node = this.traverse(current.children[i], parent);
                i += 1;
            }
            return node;
        }
        return null;
    }

    createNode(name, jobId) {
        return {
            name,
            jobId,
            children: [],
        };
    }

    async delete({ id }) {
        const result = await super.delete({ id }, { queryInnerId: false, allowNotFound: true });
        return result;
    }

    async fetchAll({ query = {}, fields = {}, sort = null, limit = 0 } = {}) {
        const list = await super.fetchAll({ query, fields, sort, limit, excludeId: true });
        return list;
    }
}

module.exports = TriggersTree;
