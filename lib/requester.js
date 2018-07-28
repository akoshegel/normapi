var request = require('request')

var Requester = function() {}

var debugBody = require('debug')('request:body')

let processRequestBody = function(object) {
    return new Promise(resolve => {
        if(object.request.process) 
            for(key in object.request.body) 
                if(typeof object.request.body[key] == 'string') 
                    if(object.request.body[key].substr(0, 2) == '=>') 
                        object.request.body[key] = object[object.request.body[key].substr(2)]
        resolve(object)
    })
}

Requester.prototype.get = function(object, queue) {
    request.get({
        url: object.request.url,
        headers: {
            authorization: `Bearer ${object.request.adminclass}`,
            'x-shopid': object.request.shopID || 'null'
        }
    }, function(err, res, body) {
        if(err) queue.stop({
            func: '@requester-get', 
            lCode: '-E1', 
            msg: `Hiba történt a lekérés futtatása közben (URL: ${object.request.url})!`, 
            type:'request-error',
            document: err,
            statusCode: 503
        })
        else 
            try {
                debugBody(body)
                body = JSON.parse(body)
                if(body.type != 'success') queue.stop(body)
                else {
                    object[object.request.soi] = body.document || null
                    delete object.request
                    queue.next()
                }
            } catch(e) {queue.stop({
                func: '@requester-get', 
                lCode: '-E2', 
                msg: `Hiba történt a válasz feldolgozása közben (URL: ${object.request.url})!`, 
                type: 'parse-error',
                document: e,
                statusCode: 503
            })
        }
    })
}

Requester.prototype.post = function(object, queue) {
    processRequestBody(object).then(function(realRequestObject) {
        request.post({
            url: object.request.url,
            headers: {
                authorization: `Bearer ${object.request.adminclass}`,
                'x-shopid': object.request.shopID || 'null'
            },
            form: realRequestObject.request.body
        }, function(err, res, body) {
            if(err) queue.stop({
                func: '@requester-post', 
                lCode: '-E1', 
                msg: `Hiba történt a lekérés futtatása közben (URL: ${object.request.url})!`, 
                type:'request-error',
                document: err,
                statusCode: 503
            })
            else 
                try {
                    debugBody(body)
                    body = JSON.parse(body)
                    if(body.type != 'success') queue.stop(body)
                    else {
                        object[object.request.soi] = body.document || null
                        delete object.request
                        queue.next()
                    }
                } catch(e) {queue.stop({
                    func: '@requester-post', 
                    lCode: '-E2', 
                    msg: `Hiba történt a válasz feldolgozása közben (URL: ${object.request.url})!`, 
                    type: 'parse-error',
                    document: e,
                    statusCode: 503
                })}
        })
    })
}

Requester.prototype.realGet = function(object, queue) {
    return new Promise(function(resolve, reject) {
        request.get({
            url: object.url,
            headers: {
                authorization: `Bearer ${object.adminclass}`,
                'x-shopid': object.shopID || 'null'
            }
        }, function(err, res, body) {
            if(err) reject({
                func: '@realGet', 
                lCode: '-E1', 
                msg: `Hiba történt a lekérés futtatása közben (URL: ${object.request.url})!`, 
                type:'request-error',
                document: err,
                statusCode: 503
            })
            else 
                try {
                    debugBody(body)
                    body = JSON.parse(body)
                    if(body.type != 'success') reject(body)
                    else resolve(body)
                } catch(e) {reject({
                    func: '@realGet', 
                    lCode: '-E2', 
                    msg: `Hiba történt a válasz feldolgozása közben (URL: ${object.request.url})!`, 
                    type: 'parse-error',
                    document: e,
                    statusCode: 503
                })}
        })
    })
}

Requester.prototype.realPost = function(object) {
    return new Promise(function(resolve, reject) {
        request.post({
            url: object.url,
            headers: {
                authorization: `Bearer ${object.adminclass}`,
                'x-shopid': object.shopID || 'null'
            },
            form: object.body
        }, function(err, res, body) {
            if(err) reject({
                func: '@realPost', 
                lCode: '-E1', 
                msg: `Hiba történt a lekérés futtatása közben (URL: ${object.request.url})!`, 
                type:'request-error',
                document: err,
                statusCode: 503
            })
            else 
                try {
                    debugBody(body)
                    body = JSON.parse(body)
                    if(body.type != 'success') reject(body)
                    else resolve(body)
                } catch(e) {reject({
                    func: '@realPost', 
                    lCode: '-E2', 
                    msg: `Hiba történt a válasz feldolgozása közben (URL: ${object.request.url})!`, 
                    type: 'parse-error',
                    document: e,
                    statusCode: 503
                })}
        })
    })
}

module.exports = Requester