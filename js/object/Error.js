$exports.Error = {};

$exports.Error.Type = function(name) {
	var rv = function(message) {
		if (this instanceof arguments.callee) {
			this.name = name;
			this.message = message;
			var template = new Error();
			if (template.stack) {
				this.stack = template.stack;
			}
		} else {
			return new arguments.callee(message);
		}
	};
	rv.prototype = new Error();
	return rv;
};
