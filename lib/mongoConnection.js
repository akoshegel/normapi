var mongoose = require('mongoose')

const connectionDebug = require(debug)('mongo:connect')
const disconnectionDebug = require(debug)('mongo:disconnect')

class MongoConnection {

    constructor(options) {

        if(typeof options !== 'object') {
            throw new TypeError('argument options must be an object')
        }

        this._mongoOptions = options.mongoOptions
        this._credentials = options.credentials
        this._location = options.location
        this._connection = null
        this._eventsActive = false
        this._activeReconnection = false

    }

    getConnection() {
        return {
            location: this._location,
            connection:this._connection
        }
    }

    setConnection() {
        try {
            this._connection = mongoose.createConnection(`mongodb://${this._credentials.user}:${this._credentials.password}${this._credentials.url}`, this._mongoOptions)
            this.setConnectionEventHandler()
        }
        catch(error) {
            throw new Error(error)
        }
    }

    setConnectionEventHandler() {

        this._eventsActive = true

        this._connection.on('connected', () => {
            connectionDebug(`Mongoose connected at location '${this._location}'`)
            if(this._activeReconnection) clearInterval(this._activeReconnection)
        })

        this._connection.on('error', () => {
            
            this.destroyConnection()
            
            disconnectionDebug(`Mongoose connection is lost at location '${this._location}'`)
            disconnectionDebug(`Trying to reconnect at location '${this._location}' in 5s`)
            
            if(!this._activeReconnection) this._activeReconnection = setInterval(() => this.setConnection(), 5000)

        })

    }

    destroyConnection() {
        this._connection.close()
    }
}

module.exports = MongoConnection 