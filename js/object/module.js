//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.$api.old.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.$api.old.Exports } $exports
	 */
	function($api,$context,$loader,$exports) {
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

		/**
		 * @type { slime.$api.old.Exports["constant"] }
		 */
		var constant = function constant(f) {
			return function() {
				if (typeof(arguments.callee["called"]) == "undefined") {
					arguments.callee["result"] = f.call(this);
					arguments.callee["called"] = true;
				}
				return arguments.callee["result"];
			}
		}

		$exports.constant = deprecate(constant);

		//@ts-ignore
		$exports.lazy = function(object,name,getter) {
			Object.defineProperty(
				object,
				name,
				{
					enumerable: true,
					get: constant(getter)
				}
			);
			return object;
		};

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

				/** @type { (x: any) => string } */
				var _typeof = function(x) {
					return typeof(x);
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
					} else if (_typeof(it) == "xml") {
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
				} else if (_typeof(value) == "xml") {
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
					// } else if (object.constructor.prototype == Date.prototype) {
					} else if (value.getFullYear && value.getYear) {
						//	TODO	Seems like the original form of the test does not work in Rhino, for some reason
						//	TODO	Above comment may have been written when the Date constructor had been replaced by the js/time module
						return "new Date(" + value.getTime() + ")";
					} else {
						// var extended = extensions.encode(object);
						// if (extended) {
						// 	return extended;
						// }
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
				delegates.push(Self["methods"](o));
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
						var propertyValue = (typeof(o[x]) == "undefined") ? void(0) : o[x];
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
		$api.experimental($exports,"properties");

		$exports.Object = (
			function() {
				var path = new function() {
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
				/** @type { slime.$api.old.object.Exports } */
				var rv = {
					keys: function(o) {
						return properties.names(o);
					},
					values: function(o) {
						return properties.values(o);
					},
					pairs: Object.assign(
						function(o) {
							return properties.pairs(o);
						},
						{
							create: function(array) {
								var rv = {};
								array.forEach(function(item) {
									rv[item.name] = item.value;
								});
								return rv;
							}
						}
					),
					set: function(o) {
						if (typeof(o) != "object" || o == null) {
							throw new TypeError("First argument must be an object.");
						}
						for (var i=1; i<arguments.length; i++) {
							for (var x in arguments[i]) {
								o[x] = arguments[i][x];
							}
						}
						return o;
					},
					path: path,
					expando: path
				};
				return rv;
				// return new function() {
				// 	this.keys = function(o) {
				// 		return properties.names(o);
				// 	};

				// 	this.values = function(o) {
				// 		return properties.values(o);
				// 	};

				// 	this.pairs = Object.assign(function(o) {
				// 		return properties.pairs(o);
				// 	}, { create: void(0) });
				// 	this.pairs.create = function(array) {
				// 		var rv = {};
				// 		array.forEach(function(item) {
				// 			rv[item.name] = item.value;
				// 		});
				// 		return rv;
				// 	}

				// 	this.set = function(o) {
				// 		if (typeof(o) != "object" || o == null) {
				// 			throw new TypeError("First argument must be an object.");
				// 		}
				// 		for (var i=1; i<arguments.length; i++) {
				// 			for (var x in arguments[i]) {
				// 				o[x] = arguments[i][x];
				// 			}
				// 		}
				// 		return o;
				// 	}

				// 	this.path = new function() {
				// 		var find = function(o,n,create) {
				// 			var target = o;
				// 			var tokens = n.split(".");
				// 			for (var i=0; i<tokens.length-1; i++) {
				// 				if (typeof(target[tokens[i]]) == "undefined") {
				// 					if (create) {
				// 						target[tokens[i]] = {};
				// 					} else {
				// 						return {};
				// 					}
				// 				}
				// 				target = target[tokens[i]];
				// 			}
				// 			return {
				// 				target: target,
				// 				name: tokens[tokens.length-1]
				// 			};
				// 		}

				// 		this.get = function(o,n) {
				// 			var location = find(o,n);
				// 			if (location.target) {
				// 				return location.target[location.name];
				// 			}
				// 		}

				// 		this.set = function(o,n,v) {
				// 			var location = find(o,n,true);
				// 			location.target[location.name] = v;
				// 		}
				// 	};

				// 	this.expando = this.path;
				// //	$api.deprecate(this,"expando");
				// };
			}
		)();
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

		$exports.Function = $api.fp;
		$api.deprecate($exports, "Function");

		$exports.Filter = new function() {
			/** @type { slime.$api.old.Exports["Filter"]["property"] } */
			this.property = function(name,filter) {
				if (typeof(filter) != "function") {
					return $api.deprecate(function(o) {
						return o[name] == filter;
					});
				} else {
					return function(o) {
						return filter(o[name]);
					}
				}
			}

			/** @type { slime.$api.old.Exports["Filter"]["equals"] } */
			this.equals = function(value) {
				return function(v) {
					return v == value;
				}
			};

			this.not = void(0);
			this.or = void(0);
			this.and = void(0);
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
					Object.assign(rv,self);
					return rv;
				};
			})(this);

			this.one = function(filter) {
				var select = (filter) ? ArrayMethods.select.call(this,filter) : this;
				if (select.length > 1) throw new RangeError("Too many matches for filter " + filter + " in " + this);
				if (select.length == 0) return null;
				return select[0];
			};

			/** @this { Array } */
			this.fold = function(f,initial) {
				var current = initial;
				for (var i=0; i<this.length; i++) {
					current = f.call(this[i],current);
				}
				return current;
			};

			/** @this { Array } */
			this.each = function(f) {
				var rv = create();
				for (var i=0; i<this.length; i++) {
					rv[i] = f.call(this[i]);
				}
				return rv;
			};

			/** @this { Array } */
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

		//@ts-ignore Confused because of function called both as constructor and function;
		$exports.Array = Object.assign(
			/**
			 * @param { Array & { one: any, each: any, fold: any, select: any } } array
			 * @returns { Array & { one: any, each: any, fold: any, select: any } }
			 */
			function(array) {
				if (this.constructor == arguments.callee.prototype) {
					//	called with new
					array = Object.assign(
						array.slice(),
						{
							one: void(0),
							each: void(0),
							fold: void(0),
							select: void(0)
						}
					);
				}

				array.one = ArrayMethods.one;
				array.each = ArrayMethods.each;
				array.fold = ArrayMethods.fold;
				array.select = ArrayMethods.select;

				return array;
			},
			{
				choose: void(0),
				toValue: void(0),
				categorize: void(0)
			}
		)
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

		$exports.Task = {
			tell: function(p) {
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
			}
		};

		$exports.deprecate = $api.deprecate($api.deprecate);
	}
//@ts-ignore
)($api,$context,$loader,$exports);
