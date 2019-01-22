const QueryBuilder = require('./querybuilder');
const MongoConnection = require('./mongoConnection');
const Queue = require('./queue');

const SuccessObject = require('./objects/QueueSuccess');
const ConnectionErrorObject = require('./objects/ConnectionError');
const QueryErrorObject = require('./objects/QueryError');
const SchemaErrorObject = require('./objects/SchemaError');

class Api {
	constructor() {
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

		this.queryBuilder = QueryBuilder;
		this._mongo = {};
		this.schemas = {};
		this.middlewares = {};
	}

	mongo(connections) {
		connections.forEach(connection => {
			this._mongo[connection.key] = new MongoConnection(connection);
		});
	}

	schema(dbName, schemaName) {
		return this._mongo[dbName].getSchema(schemaName);
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
