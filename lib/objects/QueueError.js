var QueueObject = require('./QueueObject');

module.exports = class QueueError extends QueueObject {
	constructor({
		func = '@function(queue-error)',
		lCode = '-queue-error',
		httpStatusCode = 400,
		msg = 'unknown error',
		err = null,
		document = null
	} = {}) {
		super({
			type: 'queue-error',
			func: func,
			lCode: lCode,
			httpStatusCode: httpStatusCode,
			msg: msg,
			err: err,
			document: document
		});
	}
};
