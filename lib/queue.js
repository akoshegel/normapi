'use strict'

const Ajv = require('ajv')
const thenDebug = require('debug')('queue:then')
const catchDebug = require('debug')('queue:catch')
const stopDebug = require('debug')('queue:stop')

const ajv = new Ajv({
    allErrors: true, 
    useDefaults: true
})

let queueErrorObject = {
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

var Queue = module.exports = function(object) {

    if(object[0] instanceof Function) {
        this.queue = Object.entries(object)
        this.sharedObject = {}
    }
    else {
        this.queue = Object.entries(object)
        this.sharedObject = this.queue.shift()[1] || {}
    }
    this.counter = 1
    this.masterFunction = null
    this.queueLength = this.queue.length
    this.errorLogFunction = object.errorLogFunction || null
    this.repairFunction = object.repairFunction || null
    
}

Queue.prototype.init = function({errorLogFunction = Promise.resolve(), repairFunction = Promise.resolve(), schema = null, cacheEnabled = false, cachePath = null}) {
    
}

Queue.prototype.next = function() {
    if(this.queueLength == this.counter) {
        var callback = this.queue.shift()[1]
        this.masterFunction(this.sharedObject)
        .then(function({
            func = '@queue-next-then',
            lCode = '-QNT',
            msg = 'Sikeres lefutás!',
            document = null
        } = {}) {
            const response = {type: 'success', func: func, lCode: lCode, msg: msg, document: document}            
            thenDebug(response)
            callback(response)
        }, err => {
            Promise.all([queueErrorObject.errorLogFunction(err), queueErrorObject.repairFunction(err)])
            .then(() => {
                callback({
                    type: 'error-er-1.1',
                    func: '@queue-next-catch-er', 
                    lCode: '-QNC-ER', 
                    msg: 'Sikertelen lefutás!', 
                    document: null
                })
            })
            .catch(() => {
                callback({
                    type: 'error-er-1.2',
                    func: '@queue-next-catch-er', 
                    lCode: '-QNC-ER', 
                    msg: 'Sikertelen lefutás!', 
                    document: null
                })
            })
        })
        .catch((response) => {
            catchDebug(response)
            const realResponse = {
                type: response.type || 'error',
                func: response.func || '@queue-next-catch', 
                lCode: response.lCode || '-QNC', 
                msg: response.msg || 'Sikertelen lefutás!', 
                document: response.document || null
            }
            if(queueErrorObject.types.includes(realResponse.type)) callback(realResponse)
            else Promise.all([queueErrorObject.errorLogFunction(response), queueErrorObject.repairFunction(response)])
            .then(() => {
                callback({
                    type: 'error-er-2.1',
                    func: '@queue-next-catch-er', 
                    lCode: '-QNC-ER', 
                    msg: 'Sikertelen lefutás!', 
                    document: null
                })
            })
            .catch(() => {
                callback({
                    type: 'error-er-2.2',
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
        if(currentItem.schema != null) {
            var valid = ajv.validate(currentItem.schema, this.sharedObject)
            if(valid) return currentItem.func(this.sharedObject, this)
            else {
                const returnFunction = (o, q) => {
                    q.stop({
                        func: '@ajv-validation-middleware',
                        lCode: '-AV',
                        type: 'schema-error',
                        msg: 'Hibás adatokat adott meg!',
                        document: o
                    })
                }
                return returnFunction(ajv.errors, this)
            }
        }
        else return currentItem.func(this.sharedObject, this)
    }
}

Queue.prototype.stop = function(funcResponse = {type = 'error', func = '@queue-stop', lCode = '-QS', msg = 'Sikertelen lefutás!', document = null} = {}) {
    stopDebug(funcResponse)
    var callback = this.queue.pop()[1]
    this.queue = null
    const response = {
        type: funcResponse.type,
        func: funcResponse.func, 
        lCode: funcResponse.lCode, 
        msg: funcResponse.msg, 
        document: funcResponse.document
    }
    callback(response)
}

Queue.prototype.setMasterFunction = function(schema, masterFunction) {
    if(schema === undefined || schema == null) this.masterFunction = masterFunction
    else this.masterFunction = function(object) {
        return new Promise(function(resolve, reject) {
            var valid = ajv.validate(schema, object)
            if(valid) {
                masterFunction(object).then(function(response) {
                    resolve(response)
                    console.log("afasdfasdfas")
                }, err => console.log(err)).catch(function(response) {
                    console.log("afasdfasdfas2")
                    reject(response)
                }, err => console.log(err))
            }
            else reject({
                func: '@ajv-validation', 
                lCode: '-AV', 
                msg: 'Hibás adatokat adott meg!', 
                type: 'schema-error',
                document: ajv.errors
            })
        })
    }
}

Queue.prototype.setQueueFunctions = function({errorLogFunction = function() {return Promise.resolve()}, repairFunction = function() {return Promise.resolve()}} = {}) {
    queueErrorObject.errorLogFunction = errorLogFunction
    queueErrorObject.repairFunction = repairFunction

}