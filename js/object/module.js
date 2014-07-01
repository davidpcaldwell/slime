//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the js/object SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var globals = $loader.file("global.js");

if ($context.globals) {
	var copyGlobals = function(exported,global) {
		for (var x in exported) {
			if (!global.prototype[x]) {
				global.prototype[x] = exported[x];
			}
		}
	};

	if (typeof(globals) == "undefined") {
		//	NASHORN
		globals = $loader.file("global.js");
	}
	copyGlobals(globals.Array,Array);
	copyGlobals(globals.String,String);
}

var deprecate = $api.deprecate;
var experimental = $api.experimental;

//	TODO	Create a branch that is even better, using defineProperty correctly
if ($platform && $platform.Object.defineProperty && $platform.Object.defineProperty.accessor) {
	$exports.__defineGetter__("undefined", function(){});
} else {
	$exports.undefined = function(){}();
}

$exports.defined = function() {
	var _undefined;
	for (var i=0; i<arguments.length; i++) {
		if (typeof(arguments[i]) != "undefined") return arguments[i];
	}
	return _undefined;
}

var constant = function(f) {
	return function() {
		if (typeof(arguments.callee.called) == "undefined") {
			arguments.callee.result = f.call(this);
			arguments.callee.called = true;
		}
		return arguments.callee.result;
	}
}

$exports.constant = constant;

if ($platform && $platform.Object.defineProperty && $platform.Object.defineProperty.accessor) {
	$exports.lazy = function(object,name,getter) {
		object.__defineGetter__(name, constant(getter));
	}
}

var toLiteral = function(value) {
	var sourceify = function(value,references) {
		var UNDEFINED = "(function() {})()";

		var escape = function(string) {
			string = string.replace(/\\/g, "\\\\");
			string = string.replace(/\"/g, "\\\"");
			string = string.replace(/\t/g, "\\t");
			string = string.replace(/\n/g, "\\n");
			string = string.replace(/\r/g, "\\r");
			return string;
		}

		var literal = function(it) {
			if (typeof(it) == "object") {
				return sourceify(it,references);
			} else if (typeof(it) == "boolean" || typeof(it) == "number") {
				return String(it);
			} else if (typeof(it) == "string") {
				return "\"" + escape(it) + "\"";
			} else if (typeof(it) == "function") {
				return null;
			} else if (typeof(it) == "xml") {
				return null;
			} else if (typeof(it) == "undefined") {
				return UNDEFINED;
			} else {
				return "Not implemented: typeof(it) = " + typeof(it);
			}
		}

		if (typeof(value) == "undefined") {
			return UNDEFINED;
		} else if (value === null) {
			return "null";
		} else if (typeof(value) == "number" || typeof(value) == "boolean") {
			return String(value);
		} else if (typeof(value) == "string") {
			return "\"" + escape(value) + "\"";
		} else if (typeof(value) == "function") {
			return null;
		} else if (typeof(value) == "xml") {
			return null;
		} else if (typeof(value) == "object") {
			if (globals.Array.indexOf.call(references,value) == -1) {
				references.push(value);
			} else {
				debugger;
				throw new Error("Recursion in toLiteral(): trying to reserialize " + value);
			}

			var isAnArray = function(object) {
				//	return object.constructor && (object.constructor.prototype == Array.prototype)
				//	return object instanceof Array
				//	TODO	indexOf is not defined if globals is false
				return typeof(object.slice) == "function" && typeof(object.splice) == "function";
			}

			if (isAnArray(value)) {
				//	we leave out non-numeric properties; the Mozilla toSource() does this too
				return "[" + globals.Array.map.call( value, function(item) {
					return literal(item);
				} ).join(",") + "]";
	//		} else if (object.constructor.prototype == Date.prototype) {
			} else if (value.getFullYear && value.getYear) {
				//	TODO	Seems like the original form of the test does not work in Rhino, for some reason
				//	TODO	Above comment may have been written when the Date constructor had been replaced by the js/time module
				return "new Date(" + value.getTime() + ")";
			} else {
//				var extended = extensions.encode(object);
//				if (extended) {
//					return extended;
//				}
				var properties = [];
				for (var x in value) {
					var source = sourceify(value[x],references);
					if (source) {
						properties.push( "\"" + x + "\":" + source);
					}
				}
				return "{" + properties.join(",") + "}";
			}
		} else {
			//	TODO	Throw exception?
			return null;
		}
	}
	return sourceify(value,[]);
}
$exports.toLiteral = toLiteral;

var ObjectTransformer = function() {
	var Self = arguments.callee;
	var delegates = [];

	this.add = function(f) {
		delegates.push(f);
	}

	this.addMapping = function(o) {
		delegates.push(Self.methods(o));
	}

	this.transform = function(o) {
		var self = this;
		if (typeof(o.length) == "number" && o.slice && o.splice) {
			return globals.Array.map.call(o, function(e) {
				//	This will recurse if elements are also arrays ... is this desirable?
				return self.transform(e);
			});
		}
		globals.Array.forEach.call(delegates, function(f) {
			o = f(o);
		});
		return o;
	}

	this.toFunction = function() {
		var self = this;
		return function(o) {
			return self.transform(o);
		}
	}
}
ObjectTransformer.methods = function(methods) {
	var f = function(o) {
		var keys = {};
		var x;
		for (x in o) {
			keys[x] = true;
		}
		for (x in methods) {
			keys[x] = true;
		}
		var rv = {};
		for (x in keys) {
			if (typeof(methods[x]) == "undefined") {
				//	copy properties not listed
				rv[x] = o[x];
			} else if (methods[x] == null) {
				//	delete the property by not adding it to rv
			} else {
				//	will receive undefined as argument if methods has the property but o does not
				var propertyValue = (typeof(o[x]) == "undefined") ? $exports.undefined : o[x];
				rv[x] = methods[x](propertyValue,o);
			}
		}
		return rv;
	};
	f.delegate = methods;
	return f;
}
$exports.ObjectTransformer = ObjectTransformer;

var properties = new function() {
	this.names = function(o) {
		var rv = [];
		for (var x in o) {
			rv.push(x);
		}
		return rv;
	}

	this.values = function(o) {
		var rv = [];
		for (var x in o) {
			rv.push(o[x]);
		}
		return rv;
	}

	this.pairs = function(o) {
		var rv = [];
		for (var x in o) {
			rv.push({
				name: x,
				value: o[x]
			});
		}
		return rv;
	}

	//	TODO	method install() that adds these methods (or a properties object?) to Object, making them non-enumerable if possible
}
$exports.properties = properties;
if ($platform && $platform.Object.defineProperty && $platform.Object.defineProperty.accessor) {
	$api.experimental($exports,"properties");
}

$exports.Object = new function() {
	this.keys = function(o) {
		return properties.names(o);
	};

	this.values = function(o) {
		return properties.values(o);
	};

	this.pairs = function(o) {
		return properties.pairs(o);
	}
	this.pairs.create = function(array) {
		var rv = {};
		array.forEach(function(item) {
			rv[item.name] = item.value;
		});
		return rv;
	}

	this.set = function(o) {
		if (typeof(o) != "object" || o == null) {
			throw new TypeError("First argument must be an object.");
		}
		for (var i=1; i<arguments.length; i++) {
			for (var x in arguments[i]) {
				o[x] = arguments[i][x];
			}
		}
		return o;
	}
	
	this.path = new function() {
		var find = function(o,n,create) {
			var target = o;
			var tokens = n.split(".");
			for (var i=0; i<tokens.length-1; i++) {
				if (typeof(target[tokens[i]]) == "undefined") {
					if (create) {
						target[tokens[i]] = {};
					} else {
						return {};
					}
				}
				target = target[tokens[i]];
			}
			return {
				target: target,
				name: tokens[tokens.length-1]
			};
		}

		this.get = function(o,n) {
			var location = find(o,n);
			if (location.target) {
				return location.target[location.name];
			}
		}

		this.set = function(o,n,v) {
			var location = find(o,n,true);
			location.target[location.name] = v;
		}
	};
	
	this.expando = this.path;
//	$api.deprecate(this,"expando");
}
$api.experimental($exports,"Object");

if ($context.globals) {
	if (!Object.keys) {
		Object.keys = function(o) {
			if (typeof(o) != "object") {
				throw new TypeError(String(o) + " is not object");
			}
			return properties.names(o);
		}
	}
}

$exports.Function = $api.deprecate(function(p) {
	return $api.Function(p);
});
$exports.Function = function() {
	var UNDEFINED = {};
	
	var Result = function() {
		this.resolve = function() {
			if (this.error) {
				throw this.throwing;
			} else {
				if (this.returning === UNDEFINED) return void(0);
				return this.returning;
			}
		};
	};

	var Situation = function() {
		var result = new Result();

		this.target = arguments[0];
		this.arguments = arguments[1];

		this.setReturn = function(v) {
			result.error = false;
			result.returning = v;
		};

		this.setThrow = function(v) {
			result.error = true;
			result.throwing = v;
		};
		
		this.result = result;
		
		this.resolve = function() {
			return result.resolve();
		};
	};
	
	var components = [];
	
	if (arguments.length != 1) {
		throw new TypeError();
	} else {
		components.push(new $exports.Function.Basic(arguments[0]));
	}
	
	var rv = function() {
		var situation = new Situation(this,Array.prototype.slice.call(arguments));
		components.forEach(function(component) {
			component.call(situation);
		});
		return situation.resolve();
	};
	
	rv.revise = function() {
		for (var i=0; i<arguments.length; i++) {
			components.push(new $exports.Function.Revise(arguments[i]));
		}
		return this;
	}
	
	return rv;
};
$exports.Function.Basic = function(f) {
	return function() {
		try {
			this.setReturn(f.apply(this.target,this.arguments));
		} catch (e) {
			this.setThrow(e);
		}
	};
};
$exports.Function.Revise = function(f) {
	return function() {
		this.setReturn(f.call({
			target: this.target,
			arguments: this.arguments,
			throwing: this.result.throwing,
			returning: this.result.returning
		},this.result.returning));
	};
};
$exports.Function.returning = function(v) {
	return function() {
		return v;
	};
};
$exports.Function.set = function(o) {
	return function() {
		for (var x in o) {
			this[x] = o[x];
		}
	};
}
$exports.Function.evaluator = function() {
	//	creates a composed function that invokes each function in turn with its arguments, returning the first result that is not
	//	undefined
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

$exports.Filter = new function() {
	this.property = function(name,filter) {
		if (typeof(filter) != "function") {
			//	the version that tests for equality is deprecated
			//	below is copy-paste from the check in flag()
			var warning = ($context.flag && $context.flag.warning) ? $context.flag.warning : function(){};
			warning({ "function": arguments.callee, call: arguments, reason: deprecate });
			return function(o) {
				return o[name] == filter;
			};
		} else {
			return function(o) {
				return filter(o[name]);
			}
		}
	}

	this.equals = function(value) {
		return function(v) {
			return v == value;
		}
	}
};
$exports.Filter.not = function(filter) {
	return function() {
		return !Boolean(filter.apply(this,arguments));
	}
};
$exports.Filter.or = function() {
	if (arguments.length == 0) throw new TypeError();
	var items = Array.prototype.slice.call(arguments);
	return function() {
		for (var i=0; i<items.length; i++) {
			if (items[i].apply(this,arguments)) return true;
		}
		return false;
	}
};
$exports.Filter.and = function() {
	if (arguments.length == 0) throw new TypeError();
	var items = Array.prototype.slice.call(arguments);
	return function() {
		for (var i=0; i<items.length; i++) {
			if (!items[i].apply(this,arguments)) return false;
		}
		return true;
	}
};

var Map = new function() {
	this.property = function(name,map) {
		if (name == "") {
			debugger;
			throw "Property name cannot be empty string";
		}
		return function(o) {
			if (!map) return o[name];
			return map(o)[name];
		}
	}
}

var Categorizer = function(p) {
	var Old = $api.deprecate(function(p) {
		var categories = {};

		this.categorize = function(o) {
			var key = p.key(o);
			var name = (p.property) ? p.property(key) : key;
			if (!categories[name]) {
				categories[name] = {
					key: key,
					category: p.category(key)
				}
			}
			if (categories[name].category.categorized) {
				categories[name].category.categorized(o);
			}
		}

		this.get = function(key) {
			var name = (p.property) ? p.property(key) : key;
			return categories[name].category.value;
		}

		this.getKeys = function() {
			return properties.values(categories).map(Map.property("key"));
		}

		this.getCategories = function() {
			return properties.values(categories).map(Map.property("category"));
		}
	});

	if (p.key && p.category) {
		return new Old(p);
	}

	var categories = {};

	var toProperty = function(key) {
		return (p.property) ? p.property(key) : key;
	}

	this.categorize = function(o) {
		var key = p.key(o);
		var name = toProperty(key);
		if (!categories[name]) {
			categories[name] = {
				key: key,
				value: new p.Category(key)
			};
		}
		if (categories[name].value.add) {
			categories[name].value.add(o);
		}
	};

	this.get = function(key) {
		var entry = categories[toProperty(key)];
		if (entry) return entry.value;
		return null;
	};

	this.getKeys = function() {
		return properties.values(categories).map(Map.property("key"));
	}

	this.getCategories = function() {
		return properties.values(categories).map(Map.property("value"));
	}
}

$exports.Map = new function() {
	this.property = Map.property;

	this.Categorizer = Categorizer;
	$api.experimental(this, "Categorizer");
}

$exports.Order = new function() {
	this.property = function(name,order) {
		return function(a,b) {
			return order(a[name],b[name]);
		}
	}

	this.map = function(map,order) {
		return function(a,b) {
			return order(map(a),map(b));
		}
	}
};

var ArrayMethods = new function() {
	var create = (function(self) {
		return function() {
			var rv = [];
			for (var x in self) {
				rv[x] = self[x];
			}
			return rv;
		};
	})(this);
	
	this.one = function(filter) {
		var select = (filter) ? ArrayMethods.select.call(this,filter) : this;
		if (select.length > 1) throw new RangeError("Too many matches for filter " + filter + " in " + this);
		if (select.length == 0) return null;
		return select[0];
	};
	
	this.fold = function(f,initial) {
		var current = initial;
		for (var i=0; i<this.length; i++) {
			current = f.call(this[i],current);
		}
		return current;		
	};
	
	this.each = function(f) {
		var rv = create();
		for (var i=0; i<this.length; i++) {
			rv[i] = f.call(this[i]);
		}
		return rv;
	};
	
	this.select = function(f) {
		var rv = create();
		for (var i=0; i<this.length; i++) {
			if (f.call(this[i])) {
				rv.push(this[i]);
			}
		}
		return rv;		
	};
};

$exports.Array = function(array) {
	if (this.constructor == arguments.callee.prototype) {
		//	called with new
		array = array.slice();
	}
	
	array.one = ArrayMethods.one;		
	array.each = ArrayMethods.each;
	array.fold = ArrayMethods.fold;
	array.select = ArrayMethods.select;
	
	return array;
}
for (var x in ArrayMethods) {
	$exports.Array[x] = (function(underlying) {
		return function(array) {
			return underlying.apply(array,Array.prototype.slice.call(arguments,1));
		}
	})(ArrayMethods[x]);
}
$exports.Array.choose = $api.deprecate(function(array,filter) {
	if (filter) {
		return ArrayMethods.one.call(array, function() {
			return filter.call(this,this);
		});
	} else {
		return ArrayMethods.one.call(array);
	}
});
$exports.Array.toValue = $exports.Array.choose;
$exports.Array.categorize = $api.experimental(function(array,p) {
	var categorizer = new Categorizer(p);
	array.forEach( function(item) {
		categorizer.categorize(item);
	} );
	return categorizer;	
});

$exports.Error = $loader.file("Error.js").Error;

$exports.Task = {};
$exports.Task.tell = function(p) {
	if (typeof(p.tell) != "function") {
		throw new TypeError();
	}
	var tell;
	if (typeof(p.target) == "object" && p.target) {
		tell = p.tell.bind(p.target);
	} else {
		tell = p.tell;
	}
	if (p.tell.length == 1) {
		if (p.threw) {
			tell({ threw: p.threw });
		} else {
			tell({ returned: p.returned });
		}
	} else if (p.tell.length == 2) {
		tell(p.threw,p.returned);
	} else {
		throw new TypeError("Tell length: " + p.tell.length + " tell=" + p.tell.toString());
	}
};

$exports.deprecate = deprecate;
$api.deprecate($exports,"deprecate");
