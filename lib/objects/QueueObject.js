module.exports = class QueueObject {
	constructor(object) {
		this.type = object.type;
		this.func = object.func;
		this.lCode = object.lCode;
		this.httpStatusCode = object.httpStatusCode;
		this.msg = object.msg;
		this.err = object.err;
		this.document = object.document;
	}

	getMessage() {
		return {
			type: this.type,
			func: this.func,
			lCode: this.lCode,
			httpStatusCode: this.httpStatusCode,
			msg: this.msg,
			err: this.err,
			document: this.document
		};
	}

	reportError() {
		console.err(`Error in queue, error object: ${this.getMessage()}`);
	}

	throwError() {
		throw new Error(this.getMessage());
	}
};
