const _projection = fields => {
    return Object.entries(fields).reduce((acc, [k, v]) => {
        acc[k] = v === true ? 1 : 0;
        return acc;
    }, {});
};

const sortOrderHelper = sortObj => {
    if (!sortObj) {
        return null;
    }
    return Object.entries(sortObj).reduce((acc, [prop, sort]) => {
        acc[prop] = sort === 'asc' ? 1 : -1;
        return acc;
    }, {});
};

const createProjection = (fields, excludeId) => {
    const projectFields = _projection(fields);
    const projection = excludeId ? { ...projectFields, _id: 0 } : projectFields;
    return projection;
};

module.exports = {
    createProjection,
    sortOrderHelper,
};
