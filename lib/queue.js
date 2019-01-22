const Ajv = require('ajv');

const queueObject = require('./objects/QueueObject');
const queueError = require('./objects/QueueError');

const ajv = new Ajv({
	allErrors: true,
	useDefaults: true
});

class Queue {
	constructor(object) {
		this.queue = [];
		this.sharedObject = {};

		if (object[0].func instanceof Function) {
			this.queue = Object.entries(object);
		} else {
			this.queue = Object.entries(object);
			this.sharedObject = this.queue.shift()[1];
		}

		this.counter = 1;
		this.queueLength = this.queue.length == 0 ? 1 : this.queue.length;

		this.masterFunction = null;
	}

	setMasterFunction(schema, masterFunction) {
		if (schema) {
			this.masterFunction = function(object) {
				return new Promise((resolve, reject) => {
					const valid = ajv.validate(schema, object);
					if (valid)
						masterFunction(object)
							.then(response => resolve(response))
							.catch(err => reject(err));
					else
						reject(
							new SchemaError({
								func: '@masterFunction',
								msg: '@masterFunction failed on schema validation',
								err: ajv.errors
							})
						);
				});
			};
		} else this.masterFunction = masterFunction;
	}

	next() {
		if (this.queueLength == this.counter) {
			const callback = this.queue.shift()[1];
			this.masterFunction(this.sharedObject)
				.then(queueSuccessObject => {
					if (queueSuccessObject instanceof queueObject) {
						callback(queueSuccessObject);
					} else {
						callback(
							new queueError({
								lCode: '-then-queue-error',
								err: new Error('the returning object should be an instance of QueueObject')
							})
						);
					}
				})
				.catch(queueErrorObject => {
					if (queueErrorObject instanceof queueObject) {
						callback(queueErrorObject);
					} else {
						callback(
							new queueError({
								lCode: '-catch-queue-error',
								err: new Error('the returning object should be an instance of QueueObject')
							})
						);
					}
				});
		} else {
			++this.counter;
			const currentItem = this.queue.shift()[1];
			if (currentItem.schema != null) {
				const valid = ajv.validate(currentItem.schema, this.sharedObject);
				if (valid) return currentItem.func(this.sharedObject, this);
				else {
					const returnFunction = function(o, q) {
						q.stop(
							new SchemaError({
								func: '@queueFunction',
								msg: '@queueFunction failed on schema validation.',
								err: ajv.errors
							})
						);
					};
					return returnFunction(ajv.errors, this);
				}
			} else return currentItem.func(this.sharedObject, this);
		}
	}

	stop(queueErrorObject) {
		const callback = this.queue.pop()[1];
		this.queue = [];
		if (queueErrorObject instanceof queueObject) {
			callback(queueErrorObject);
		} else {
			callback(
				new queueError({
					lCode: '-stop-queue-error',
					err: new Error('the returning object should be an instance of QueueObject')
				})
			);
		}
	}
}

module.exports = Queue;
