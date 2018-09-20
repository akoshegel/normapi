var Ajv = require('ajv')
var ajv = new Ajv({allErrors: true})

var lRequester = require('./requester')
var requester = new lRequester()

var thenDebug = require('debug')('queue:then')
var catchDebug = require('debug')('queue:catch')
var stopDebug = require('debug')('queue:stop')
var ajvDebug = require('debug')('ajv')

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
}

Queue.prototype.next = function() {
    if(this.queueLength == this.counter) {
        var callback = this.queue.shift()[1]
        this.masterFunction(this.sharedObject)
        .then(function(response) {
            thenDebug(response)
            if(response === undefined) throw new Error('You must send an object as resolve parameter!')
            else callback({
                func: response.func || '@queue-next-then', 
                lCode: response.lCode || '-QNT', 
                msg: response.msg || 'Sikeres lefutás!', 
                type: 'success', 
                document: response.document || null,
                statusCode: response.statusCode || 200
            })
        })
        .catch(function(response) {
            catchDebug(response)
            if(response === undefined) throw new Error('You must send an object as reject parameter!')
            else callback({
                func: response.func || '@queue-next-catch', 
                lCode: response.lCode || '-QNC', 
                msg: response.msg || 'Sikertelen lefutás!', 
                type: response.type || 'error',
                document: (response instanceof Error) ? response : (response.document || null),
                statusCode: response.statusCode || 200
            })
        }) 
    }
    else {
        ++this.counter
        let currentItem = this.queue.shift()[1]
        if(currentItem.type == 'request') {
            this.sharedObject.request = currentItem
            switch(currentItem.method) {
                case 'GET': return requester.get(this.sharedObject, this)
                case 'POST': return requester.post(this.sharedObject, this)
                default: this.stop({
                    func: '@queue-requester', 
                    lCode: '-QR', 
                    msg: `Nincs megadva lekérés típus (URL: ${currentItem.url})`, 
                    type: 'request-error',
                    document: null,
                    statusCode: 405
                })
            }
        }
        else return currentItem(this.sharedObject, this)
    }
}

Queue.prototype.stop = function(object) {
    var callback = this.queue.pop()[1]
    this.queue = null
    stopDebug(object)
    if(object === undefined) throw new Error('You must send an object as a parameter!')
    else callback({
        func: object.func || '@queue-stop', 
        lCode: object.lCode || '-QS', 
        msg: object.msg || 'Sikertelen lefutás!', 
        type: object.type || 'queue-stop-error',
        document: object.document || null,
        statusCode: object.statusCode || 200
    })
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
                type: 'validation-error',
                document: {
                    schema: schema, 
                    object: object
                },
                statusCode: 400
            })
        })
    }
}

module.exports = Queue