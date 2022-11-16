class Query {
    constructor() {
        this._map = Object.create(null);
    }

    addParam(key, value) {
        if (value !== undefined) {
            this._map[key] = value;
        }
        return this;
    }

    addInArray(key, array) {
        if (array?.length) {
            this._map[key] = { $in: array };
        }
        return this;
    }

    addDatesRange(key, range) {
        let from;
        let to;
        this._map[key] = {};
        if (range?.from) {
            from = new Date(range?.from).getTime();
            this._map[key].$gte = from;
        }

        if (range?.to) {
            to = new Date(range?.to).getTime();
            this._map[key].$lt = to;
        }
        return this;
    }

    addGt(key, value) {
        if (value !== undefined) {
            this._map[key] = {
                $gte: value
            };
        }
        return this;
    }

    addTextSearch(value) {
        if (value !== undefined) {
            this._map.$text = { $search: value };
        }
        return this;
    }

    addRegexSearch(key, value) {
        if (value !== undefined) {
            this._map[key] = { $regex: `.*${value}.*` };
        }
        return this;
    }

    addExists(exists = {}) {
        Object.entries(exists).forEach(([key, exist]) => this._addExists(key, exist));
        return this;
    }

    _addExists(key, exists) {
        if (exists !== undefined) {
            this._map[key] = { $exists: exists };
        }
        return this;
    }

    addArrayGt(key, value, arraySize) {
        if (value !== undefined) {
            this._map[key] = { $exists: true };
            this._map.$where = `this.${key}.length >= ${arraySize}`;
        }
        return this;
    }

    create() {
        return this._map;
    }
}

module.exports = Query;
