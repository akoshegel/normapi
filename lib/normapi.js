const mongoose = require('mongoose')
const queryBuilder = require('./querybuilder')
let Queue = require('./queue')

let API = function(defaults) {
    defaults = defaults || {}
    queue = null
    this.middlewares = {}
    this.mongooseCredentials = {}
    this.mongodb = {}
    this.schemas = {}
    this.queueErrorLogFunction = defaults.queueErrorLogFunction
    this.queueRepairFunction = defaults.queueRepairFunction
    this.defaultQueueFunctions = defaults.defaultQueueFunctions
    this.queryBuilder = queryBuilder
    this.queueCacheEnabled = defaults.queueCacheEnabled
    this.cachePath = defaults.cachePath || null
}

API.prototype.mongoConnect = function(where) {
    const opts = {
        useNewUrlParser: true
    }
    if(this.mongooseCredentials[where] === undefined) throw 'Please set mongooseCredentials with setMongooseCredentials(where, object) function ...'
    else {
        this.mongodb[where] = {}
        this.mongodb[where] = mongoose.createConnection('mongodb://' + this.mongooseCredentials[where].user + ':' + this.mongooseCredentials[where].password + this.mongooseCredentials[where].url, opts)
    }
}

API.prototype.mongoClose = function(where) {
    this.mongodb[where].close()
    mongoose[where].disconnect()
}

API.prototype.setMongooseCredentials = function(where, {user = null, url = null, password = null} = {}) {
    if(where == null, user == null || url == null || password == null) throw new Error('You must define the where, user, name, url for the connection ...')
    else this.mongooseCredentials[where] = {
        url: url,
        user: user,
        password: password
    }
}

API.prototype.addSchema = function(where, schemaName, collectionName, object) {
    if(this.mongodb[where] == null) throw 'Please set a connection with mongoConnect function!'
    else if(this.schemas.hasOwnProperty(schemaName)) throw 'Duplicated schema... u idiot'
    else this.schemas[schemaName] = this.mongodb[where].model(schemaName, new mongoose.Schema(object), collectionName)
}

API.prototype.addFunction = function(defs, rFunction) {
    const funcErrorLogFunction = this.queueErrorLogFunction
    const funcRepairFunction = this.queueRepairFunction
    if(rFunction instanceof Function) {
        this[defs.name] = function() {
            this.queue = new Queue(arguments)
            if(this.defaultQueueFunctions || !(defs.uniqueQueueFunctions)) this.queue.setQueueFunctions({errorLogFunction: funcErrorLogFunction, repairFunction: funcRepairFunction})
            else this.queue.setQueueFunctions(defs.errorLogFunction, defs.repairFunction)
            this.queue.setMasterFunction(defs.schema, rFunction)
            this.queue.next()
        }
    }
    else new Error('The last parameter must be a function!')
}

API.prototype.addMiddleware = function(object, func) {
    this.middlewares[object.name] = {schema: object.schema, func: func}
}

module.exports = API