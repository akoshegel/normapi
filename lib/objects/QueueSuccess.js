var QueueObject = require('./QueueObject');

module.exports = class QueueSuccess extends QueueObject {
	constructor({
		func = '@function(success)',
		lCode = '-success',
		httpStatusCode = 200,
		msg = 'function done',
		err = null,
		document = null
	} = {}) {
		super({
			type: 'success',
			func: func,
			lCode: lCode,
			httpStatusCode: httpStatusCode,
			msg: msg,
			err: false,
			document: document
		});
	}
};
