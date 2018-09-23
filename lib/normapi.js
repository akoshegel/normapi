const fs = require('fs')
var mongoose = require('mongoose')
var Queue = require('./queue')
var lRequester = require('./requester')
var queryBuilder = require('./querybuilder')

var API = function(defaults) {
  defaults = defaults || {}
  mongodb = null
  mongooseCredentials = null
  queue = null
  this.middlewares = {}
  this.schemas = {}
  this.requester = new lRequester()
  this.queryBuilder = queryBuilder
  this.queueErrorLogFunction = defaults.queueErrorLogFunction
  this.queueRepairFunction = defaults.queueRepairFunction
  this.defaultQueueFunctions = defaults.defaultQueueFunctions
}

API.prototype.addMiddleware = function(name, func) {
  this.middlewares[name] = func
}

API.prototype.mongoConnect = function() {
  let opts = {
    useNewUrlParser: true
  }
  if(this.mongooseCredentials == null) throw 'Please set mongooseCredentials with setMongooseCredentials(object) function ...'
  else this.mongodb = mongoose.createConnection('mongodb://' + this.mongooseCredentials.user + ':' + this.mongooseCredentials.passwd + this.mongooseCredentials.url, opts)
}

API.prototype.mongoClose = function() {
    this.mongodb.close()
    mongoose.disconnect()
    this.openSchema = null
}

API.prototype.setMongooseCredentials = function(object) {
  if(object.user === 'undefined' || object.user == null) throw 'You must define the \'USER\' of the connection!'
  else if(object.url === 'undefined' || object.url == null) throw 'You must define the \'URL\' of the connection!'
  else if(object.passwd === 'undefined' || object.passwd == null) throw 'You must define the \'PASSWORD\' of the connection!'
  else { this.mongooseCredentials = object }
}

API.prototype.addSchema = function(database, object) {
  if(this.mongodb == null) throw 'Please set a connection with mongoConnect function!'
  else if(this.schemas.hasOwnProperty(database)) throw 'Duplicated schema... u idiot'
    else this.schemas[database] = this.mongodb.model(database, new mongoose.Schema(object))
}

API.prototype.addFunction = function(defs, rFunction) {
  if(rFunction instanceof Function) {
    this[defs.name] = function() {
      this.queue = new Queue(arguments)
      if(this.defaultQueueFunctions || !(defs.uniqueQueueFunctions)) this.queue.setQueueFunctions({errorLogFunction: this.queueErrorLogFunction, repairFunction: this.queueRepairFunction})
      else this.queue.setQueueFunctions(defs.errorLogFunction, defs.repairFunction)
      this.queue.setMasterFunction(defs.schema, rFunction)
      this.queue.next()
    }
  }
  else new Error('The second parameter must be a function!')
}

module.exports = API