var QueueObject = require('./QueueObject');

module.exports = class SchemaError extends QueueObject {
	constructor({
		func = '@function(schema-error)',
		lCode = '-schema-error',
		httpStatusCode = 400,
		msg = 'the schema is not valid',
		err = null,
		document = null
	} = {}) {
		super({
			type: 'schema-error',
			func: func,
			lCode: lCode,
			httpStatusCode: httpStatusCode,
			msg: msg,
			err: err,
			document: document
		});
	}
};
