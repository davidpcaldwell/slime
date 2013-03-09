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
			string = string.replace(/\r/g, "");
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
			//	TODO	indexOf is not defined if globals is false
			if (globals.Array.indexOf(references,value) == -1) {
				references.push(value);
			} else {
				debugger;
				throw new Error("Recursion in toLiteral()");
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
						properties.push( "'" + x + "':" + source);
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
		for (var i=1; i<arguments.length; i++) {
			for (var x in arguments[i]) {
				o[x] = arguments[i][x];
			}
		}
		return o;
	}

	this.expando = new function() {
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
	}
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

$exports.Function = function(p) {
	return function() {
		var called = {
			target: this,
			arguments: Array.prototype.slice.call(arguments)
		};
		var before = [];
		if (p.before && p.before.sort) {
			before = p.before;
		} else if (p.before && p.before.call) {
			before = [p.before];
		}
		//	TODO	should we allow replacement of 'this' as well as arguments?
		for (var i=0; i<before.length; i++) {
			before[i].call(null,called);
		}
		called.returned = p.call.apply(called.target,called.arguments);
		var after = [];
		if (p.after && p.after.sort) {
			after = p.after;
		} else if (p.after && p.after.call) {
			after = [p.after];
		}
		for (var i=0; i<after.length; i++) {
			after[i].call(null,called);
		}
		return called.returned;
	};
};
$exports.Function.evaluator = function() {
	//	creates a composed function that invokes each function in turn with its arguments, returning the first result that is not
	//	undefined
	var components = arguments;
	return function() {
		var rv;
		for (var i=0; i<components.length; i++) {
			rv = components[i].apply(this,arguments);
			if (typeof(rv) != "undefined") {
				return rv;
			}
		}
		return rv;
	}
}
$api.experimental($exports,"Function");

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
}
$exports.Filter.not = function(filter) {
	return function() {
		return !Boolean(filter.apply(this,arguments));
	}
}

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
	var getKey = p.key;
	var keyToString = p.property;
	var categoryFactory = p.category;

	var categories = {};

	this.categorize = function(o) {
		var key = getKey(o);
		var name = (keyToString) ? keyToString(key) : key;
		if (!categories[name]) {
			categories[name] = {
				key: key,
				category: categoryFactory(key)
			}
		}
		if (categories[name].category.categorized) {
			categories[name].category.categorized(o);
		}
	}

	this.get = function(key) {
		var name = (keyToString) ? keyToString(key) : key;
		return categories[name].category.value;
	}

	this.getKeys = function() {
		return properties.values(categories).map(Map.property("key"));
	}

	this.getCategories = function() {
		return properties.values(categories).map(Map.property("category"));
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
}

$exports.Array = new function() {
	this.choose = function(array,filter) {
		var select = (filter) ? globals.Array.filter.call(array, filter) : array;
		if (select.length > 1) throw "Too many matches for filter " + filter + " in " + array;
		if (select.length == 0) return null;
		return select[0];
	}

	this.categorize = function(array,p) {
		var categorizer = new Categorizer(p);
		array.forEach( function(item) {
			categorizer.categorize(item);
		} );
		return categorizer;
	};
	$api.experimental(this, "categorize");

	this.toValue = function(array) {
		return this.choose(array);
	}
	deprecate(this,"toValue");
}

$exports.deprecate = deprecate;
$api.deprecate($exports,"deprecate");