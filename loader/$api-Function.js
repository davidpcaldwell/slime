$exports.Function = $context.old.Function;

$exports.Function.type = function(o) {
	if (o === null) return "null";
	return typeof(o);
}

$exports.Function.memoized = function(f) {
	var returns;

	return function() {
		if (arguments.length > 0) throw new TypeError("Memoized functions may not have arguments.");
		//	Ignore 'this'
		if (!returns) {
			returns = { value: f() };
		}
		return returns.value;
	};
};

$exports.Function.pipe = function() {
	var items = Array.prototype.slice.call(arguments);
	return function(v) {
		var rv = v;
		for (var i=0; i<items.length; i++) {
			rv = items[i].call(this,rv);
		}
		return rv;
	}
};

$exports.Function.result = function() {
	var items = Array.prototype.slice.call(arguments);
	return $exports.Function.pipe.apply(this, items.slice(1))(items[0]);
}

$exports.Function.property = function(name) {
	return function(v) {
		//  TODO    handling of undefined, null?
		return v[name];
	}
};

$exports.Function.is = function(value) {
	return function(v) {
		return v === value;
	}
};

$exports.Function.returning = function(v) {
	return function() {
		return v;
	};
};

$exports.Function.conditional = function(test,yes,no) {
	return function() {
		var condition = test.apply(this,arguments);
		return (condition) ? yes.apply(this,arguments) : no.apply(this,arguments);
	};
};

$exports.Function.String = {
	split: function(delimiter) {
		return function(string) {
			return string.split(delimiter);
		}
	}
};

$exports.Function.Array = {
	map: function(f) {
		return function(array) {
			return array.map(f, this);
		}
	}
};

$exports.Function.Object = {
	entries: function(o) {
		return Object.entries(o);
	},
	fromEntries: function(iterable) {
		return Object.fromEntries(iterable);
	}
}

$exports.Function.argument = {};
$exports.Function.argument.check = function(p) {
	if (p.type) {
		var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
		return function() {
			if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
			if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
			if (typeof(arguments[p.index]) != p.type) throw new TypeError(reference + " must be type " + "\"" + p.type + "\"" + ", not " + typeof(arguments[p.index]));
		}
	}
};
$exports.Function.argument.isString = function(p) {
	var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
	return function() {
		if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
		if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
		if (typeof(arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(arguments[p.index]));
	};
};

$exports.Function.evaluator = function() {
	//	Provides an ordered cache implementation
	var components = arguments;
	return function() {
		var rv;
		var invocation = {
			target: this,
			arguments: Array.prototype.slice.call(arguments)
		};
		for (var i=0; i<components.length; i++) {
			if (typeof(components[i]) == "function") {
				rv = components[i].apply(this,arguments);
			} else if (typeof(components[i]) == "object") {
				rv = components[i].get(invocation);
			}
			if (typeof(rv) != "undefined") {
				for (var j=i; j>=0; j--) {
					if (typeof(components[j]) == "object") {
						components[j].set(invocation,rv);
					}
				}
				return rv;
			}
		}
		return rv;
	};
};

$exports.Function.series = function() {
	var functions = arguments;
	return function() {
		for (var i=0; i<functions.length; i++) {
			var rv = functions[i].apply(this,arguments);
			if (typeof(rv) != "undefined") return rv;
		}
	};
};
