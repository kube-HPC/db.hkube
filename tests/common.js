const uuid = require('uuid');

const generateAlgorithm = options => ({
    name: `alg-${uuid.v4()}`,
    algorithmImage: `hkube/algorithm-${uuid.v4()}`,
    cpu: options?.cpu || 1,
    mem: '256Mi',
    env: options?.env || 'python',
    options: {
        debug: false,
        pending: false,
    },
    minHotWorkers: 0,
    type: 'Image',
});

const generateVersion = algorithm => {
    const version = uuid.v4();
    return {
        version,
        name: algorithm.name,
        semver: '1.0.0',
        created: Date.now(),
        algorithm: { ...algorithm, version },
    };
};

const generateBuild = algorithm => {
    const buildId = uuid.v4();
    return {
        buildId: buildId,
        imageTag: 'lfhge07l',
        algorithm,
        env: 'python',
        fileExt: 'zip',
        filePath: 'cicd-hkube-builds/test1-wds86s',
        algorithmName: algorithm.name,
        type: 'Code',
        status: 'active',
        progress: 60,
        error: null,
        trace: null,
        endTime: null,
        startTime: 1606063275506,
        data: null,
        timestamp: 1606063281438,
    };
};

module.exports = {
    generateAlgorithm,
    generateVersion,
    generateBuild,
};
