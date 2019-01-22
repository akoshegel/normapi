const QueryBuilder = require('./querybuilder');
const MongoConnection = require('./mongoConnection');
const Queue = require('./queue');

const SuccessObject = require('./objects/QueueSuccess');
const ConnectionErrorObject = require('./objects/ConnectionError');
const QueryErrorObject = require('./objects/QueryError');
const SchemaErrorObject = require('./objects/SchemaError');

const cacheDebug = require('debug')('normapi:cache');

class Api {
	constructor(options) {
		if (typeof options !== 'object') {
			throw new TypeError('argument options must be an object');
		}

		this.queueObjects = {
			error: {
				connection: ConnectionErrorObject,
				query: QueryErrorObject,
				schema: SchemaErrorObject
			},
			success: {
				basic: SuccessObject
			}
		};

		this.connectionInfo = options.connectionInfo;
		this.useQueryBuilder = options.useQueryBuilder;

		this.queryBuilder = null;
		this.mongodb = null;
		this.schemas = {};
		this.middlewares = {};
		this.ready = false;
	}

	mongoSetup() {
		this.mongodb = new MongoConnection(this.connectionInfo);
		if (this.useQueryBuilder) this.queryBuilder = QueryBuilder;
		this.ready = true;
	}

	addSchema(key, schema) {
		if (this.ready) {
			this.mongodb.addSchema(key, schema);
		} else {
			throw new Error('The Api is not ready for accept schemas');
		}
	}

	addFunction(options, func) {
		if (func instanceof Function) {
			this[options.name] = function() {
				this.queue = new Queue(arguments);
				this.queue.setMasterFunction(options.schema, func);
				this.queue.next();
			};
		} else throw new Error('The second parameter must be a function');
	}

	addMiddleware(options, middleware) {
		if (middleware instanceof Function) {
			this.middlewares[options.name] = {
				schema: options.schema,
				func: middleware
			};
		} else throw new Error('The second parameter must be a function');
	}
}

module.exports = Api;
