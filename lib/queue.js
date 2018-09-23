var Ajv = require('ajv')
var ajv = new Ajv({allErrors: true})

var lRequester = require('./requester')
var requester = new lRequester()

var thenDebug = require('debug')('queue:then')
var catchDebug = require('debug')('queue:catch')
var stopDebug = require('debug')('queue:stop')
var ajvDebug = require('debug')('ajv')

var queueErrorObject = {
    errorLogFunction: null,
    repairFunction: null,
    types: [
        'error',
        'data-error',
        'quantity-error',
        'query-error',
        'middleware-error',
        'file-error',
        'connection-error',
        'authentication-error',
        'request-error',
        'schema-error',
        'missing-data-error',
        'service-not-available-error',
        'transaction-error'
    ]
}

var Queue = function(object) {
    this.counter = 1
    this.masterFunction = null
    if(object[0] instanceof Function) {
        this.queue = Object.entries(object)
        this.sharedObject = {}
    } else {
        this.queue = Object.entries(object)
        this.sharedObject = this.queue.shift()[1] || {}
    }
    this.queueLength = this.queue.length

    this.errorLogFunction = object.errorLogFunction || null
    this.repairFunction = object.repairFunction || null
}

Queue.prototype.next = function() {
    if(this.queueLength == this.counter) {
        var callback = this.queue.shift()[1]
        this.masterFunction(this.sharedObject)
        .then(function({func = '@queue-next-then', lCode = '-QNT', msg = 'Sikeres lefutás!', document = null} = {}){
            const response = {type: 'success', func: func, lCode: lCode, msg: msg, document: document}            
            thenDebug(response)
            callback(response)
        })
        .catch(function(response) {
            catchDebug(response)
            const realResponse = {
                type: response.type || 'error',
                func: response.func || '@queue-next-catch', 
                lCode: response.lCode || '-QNC', 
                msg: response.msg || 'Sikertelen lefutás!', 
                document: response.document || null
            }
            if(queueErrorObject.types.includes(realResponse.type)) callback(realResponse)
            else Promise.all([queueErrorObject.errorLogFunction(response), queueErrorObject.repairFunction(response)]).then(() => {
                callback({
                    type: 'error-er',
                    func: '@queue-next-catch-er', 
                    lCode: '-QNC-ER', 
                    msg: 'Sikertelen lefutás!', 
                    document: null
                })
            })
        }) 
    }
    else {
        ++this.counter
        let currentItem = this.queue.shift()[1]
        return currentItem(this.sharedObject, this)
    }
}

Queue.prototype.stop = function({type = 'error', func = '@queue-stop', lCode = '-QS', msg = 'Sikertelen lefutás!', document = null} = {}) {
    var callback = this.queue.pop()[1]
    this.queue = null
    const response = {
        type: type,
        func: func, 
        lCode: lCode, 
        msg: msg, 
        document: document
    }
    callback(response)
}

Queue.prototype.setMasterFunction = function(schema, masterFunction) {
    if(schema === undefined || schema == null) this.masterFunction = masterFunction
    else this.masterFunction = function(object) {
        return new Promise(function(resolve, reject) {
            var valid = ajv.validate(schema, object)
            ajvDebug(ajv.errors)
            if(valid) {
                masterFunction(object).then(function(response) {
                    resolve(response)
                }).catch(function(response) {
                    reject(response)
                })
            }
            else reject({
                func: '@ajv-validation', 
                lCode: '-AV', 
                msg: 'Hibás adatokat adott meg!', 
                type: 'schema-error',
                document: {
                    schema: schema, 
                    object: object
                }
            })
        })
    }
}

Queue.prototype.setQueueFunctions = function({errorLogFunction = function() {return Promise.resolve()}, repairFunction = function() {return Promise.resolve()}} = {}) {
    queueErrorObject.errorLogFunction = errorLogFunction
    queueErrorObject.repairFunction = repairFunction
}

module.exports = Queue