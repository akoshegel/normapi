const mongoose = require('mongoose');

class MongoConnection {
	constructor({
		key = null,
		db = null,
		credentials = ({ url = null, user = null, password = null } = {}),
		schemas = []
	} = {}) {
		this._key = key;
		this._db = db;
		this._connection = null;
		this._credentials = credentials;
		this._definedSchemas = schemas;
		this._schemas = {};

		this._mongoOptions = { useNewUrlParser: true };

		this.setConnection();
		this.processSchemas();
	}

	setConnection() {
		try {
			this._connection = mongoose.createConnection(
				`mongodb://${this._credentials.user}:${this._credentials.password}${this._credentials.url}`,
				this._mongoOptions
			);
		} catch (error) {
			throw new Error(error);
		}
	}

	destroyConnection() {
		this._connection.close();
	}

	getSchema(name) {
		return this._schemas[name];
	}

	processSchemas() {
		this._definedSchemas.forEach(({ key = null, schema = null, collection = null } = {}) => {
			this._schemas[key] = this._connection.model(key, new mongoose.Schema(schema), collection);
		});
	}
}

module.exports = MongoConnection;
