'use strict';

function ModelError(status, message) {
    if (!(this instanceof ModelError)) {
        return new ModelError(status, message);
    }

	Object.setPrototypeOf(this.constructor.prototype, Error.prototype);
	Error.captureStackTrace(this, this.constructor);

	this.name = this.constructor.name;
	this.status = status;
	this.message = message;
}

module.exports = ModelError;
