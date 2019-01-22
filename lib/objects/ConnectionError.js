var QueueObject = require('./QueueObject');

module.exports = class ConnectionError extends QueueObject {
	constructor({
		func = '@function(connection-error)',
		lCode = '-connection-error',
		httpStatusCode = 504,
		msg = 'connection refused',
		err = null,
		document = null
	} = {}) {
		super({
			type: 'connection-error',
			func: func,
			lCode: lCode,
			httpStatusCode: httpStatusCode,
			msg: msg,
			err: err,
			document: document
		});
	}
};
