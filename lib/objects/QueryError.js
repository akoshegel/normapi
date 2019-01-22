var QueueObject = require('./QueueObject');

module.exports = class QueryError extends QueueObject {
	constructor({
		func = '@function(query-error)',
		lCode = '-query-error',
		httpStatusCode = 404,
		msg = 'not found',
		err = null,
		document = null
	} = {}) {
		super({
			type: 'query-error',
			func: func,
			lCode: lCode,
			httpStatusCode: httpStatusCode,
			msg: msg,
			err: err,
			document: document
		});
	}
};
