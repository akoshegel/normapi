var QueryBuiler = function() {
    this.queries = {}
}

QueryBuiler.prototype.query = function(name, stringify) {
    return stringify ? JSON.stringify(this.queries[name]) : this.queries[name]
}

function assign(obj, keyPath, value) {
    lastKeyIndex = keyPath.length - 1
    for (var i = 0; i < lastKeyIndex; ++i) {
        key = keyPath[i]
        if (!(key in obj)) obj[key] = {}
        obj = obj[key]
    }
    obj[keyPath[lastKeyIndex]] = value
}

function remove(obj, keyPath) {
    lastKeyIndex = keyPath.length - 1
    for (var i = 0; i < lastKeyIndex; ++i) {
        key = keyPath[i]
        if (!(key in obj)) return
        obj = obj[key]
    }
    delete obj[keyPath[lastKeyIndex]]
}

QueryBuiler.prototype.add = function(name, where, what, stringify) {
    if(where == null) this.queries[name] = what
    else {
        if(this.queries[name] === undefined) this.queries[name] = {}
        assign(this.queries[name], where, what)
    }
    return stringify ? JSON.stringify(this.queries[name]) : this.queries[name]
}

QueryBuiler.prototype.remove = function(name, where, stringify) {
    remove(this.queries[name], where)
    return stringify ? JSON.stringify(this.queries[name]) : this.queries[name]
}

function getItem(obj, keyPath) {
    lastKeyIndex = keyPath.length - 1
    for (var i = 0; i < lastKeyIndex; ++i) {
        key = keyPath[i]
        if (!(key in obj)) return {}
        obj = obj[key]
    }
    return obj[keyPath[lastKeyIndex]]
}

function processQuery(query, from) {
    for(key in query) {
        if(typeof query[key] == 'object') processQuery(query[key], from)
        else if(typeof query[key] == 'string') {
            let keyPath = query[key].split('=>')
            item = getItem(from, keyPath)
            if(item === undefined) delete query[key]
            else query[key] = item
        }
    }
}

QueryBuiler.prototype.process = function(name, from, stringify) {
    let returnQuery = this.queries[name]
    return stringify ? processQuery(this.queries[name], from) :   processQuery(this.queries[name], from)
}

module.exports = new QueryBuiler()