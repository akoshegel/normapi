var QueryBuiler = function() {
    this.activeQuery = {}
}

QueryBuiler.prototype.query = function(stringify) {
    return stringify ? JSON.stringify(this.activeQuery) : this.activeQuery
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

QueryBuiler.prototype.add = function(where, what, stringify) {
    if(where == null) this.activeQuery = what
    else assign(this.activeQuery, where, what)
    return stringify ? JSON.stringify(this.activeQuery) : this.activeQuery
}

QueryBuiler.prototype.remove = function(where, stringify) {
    remove(this.activeQuery, where)
    return stringify ? JSON.stringify(this.activeQuery) : this.activeQuery
}

function getItem(obj, keyPath) {
    lastKeyIndex = keyPath.length - 1
    for (var i = 0; i < lastKeyIndex; ++i) {
        key = keyPath[i]
        if (!(key in obj)) return {}
        obj = obj[key]
    }
    return obj[keyPath[lastKeyIndex]] || false
}

function processQuery(query, from) {
    for(key in query) {
        if(typeof query[key] == 'object') processQuery(query[key], from)
        else if(typeof query[key] == 'string') {
            let keyPath = query[key].split('=>')
            if(item = getItem(from, keyPath)) query[key] = getItem(from, keyPath)
            else delete query[key]
        }
    }
}

QueryBuiler.prototype.process = function(from, stringify) {
    processQuery(this.activeQuery, from)
    return stringify ? JSON.parse(this.activeQuery) : this.activeQuery
}

module.exports = new QueryBuiler()