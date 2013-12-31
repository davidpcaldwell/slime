$exports.Error = {};

$exports.Error.Type = function(name) {
	var rv = function(message) {
		this.name = name;
		this.message = message;
		var template = new Error();
		if (template.stack) {
			this.stack = template.stack;
		}
	};
	rv.prototype = new Error();
	return rv;
};
