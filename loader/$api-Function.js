//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.fp.internal.Context } $context
	 * @param { slime.loader.Export<slime.$api.fp.Exports> } $export
	 */
	function($context,$export) {
		var code = {
			/** @type { slime.$api.fp.internal.stream.Script } */
			Stream: $context.script("$api-Function-stream.js"),
			/** @type { slime.$api.fp.internal.impure.Script } */
			impure: $context.script("$api-fp-impure.js")
		};

		var impure = code.impure({
			events: $context.events
		});

		var identity = function(v) { return v; };

		/** @type { slime.$api.fp.Exports["Maybe"] } */
		var Maybe = (
			function() {
				/** @type { slime.$api.fp.Exports["Maybe"]["nothing"] } */
				var nothing = function() {
					return { present: false };
				};
				/** @type { slime.$api.fp.Exports["Maybe"]["value"] } */
				var value = function(t) {
					return { present: true, value: t };
				};
				return {
					nothing: nothing,
					value: value,
					from: function(v) {
						if (v === null) return nothing();
						if (typeof(v) == "undefined") return nothing();
						return value(v);
					},
					map: function(f) {
						return function(maybe) {
							if (maybe.present) {
								return value(f(maybe.value));
							} else {
								return nothing();
							}
						}
					},
					else: function(f) {
						return function(maybe) {
							if (maybe.present) return maybe.value;
							return f();
						}
					},
					/** @type { slime.$api.fp.Exports["Maybe"]["present"] } */
					present: function(m) {
						return m.present;
					}
				}
			}
		)();

		var pipe = function() {
			var items = Array.prototype.slice.call(arguments);
			return function(v) {
				var rv = v;
				for (var i=0; i<items.length; i++) {
					//	If the pipeline function is called with no arguments, call the initial function with no arguments
					//	TODO	what to do if the pipeline function is called with multiple arguments?
					if (i == 0 && arguments.length == 0) {
						rv = items[i].call(this);
					} else {
						rv = items[i].call(this,rv);
					}
				}
				return rv;
			}
		};

		var property = function(name) {
			return function(v) {
				//  TODO    handling of undefined, null?
				return v[name];
			}
		};

		/** @type { slime.$api.fp.Exports["object"]["revise"] } */
		var revise = function(f) {
			if (f === null || f === void(0)) return identity;
			return function(p) {
				var rv = f.call(this,p);
				return (rv) ? rv : p;
			}
		};

		var Predicate = {
			is: function(value) {
				return function(p) {
					return p === value;
				}
			},
			equals: function(value) {
				return function(p) {
					return p == value;
				}
			},
			/** @type { slime.$api.fp.Exports["filter"]["or"] } */
			or: function() {
				var functions = Array.prototype.slice.call(arguments);
				for (var i=0; i<functions.length; i++) {
					if (typeof(functions[i]) != "function") throw new TypeError("All arguments must be functions; index " + i + " is not.");
				}
				return function(p) {
					for (var i=0; i<functions.length; i++) {
						if (functions[i](p)) return true;
					}
					return false;
				}
			},
			and: function() {
				var functions = Array.prototype.slice.call(arguments);
				for (var i=0; i<functions.length; i++) {
					if (typeof(functions[i]) != "function") throw new TypeError("All arguments must be functions; index " + i + " is not.");
				}
				return function(p) {
					for (var i=0; i<functions.length; i++) {
						if (!functions[i](p)) return false;
					}
					return true;
				}
			},
			not: function(f) {
				return function(p) {
					return !f(p);
				}
			},
			property: function(key, predicate) {
				return pipe(
					property(key),
					predicate
				);
			}
		};

		$export({
			identity: identity,
			cast: function(v) { return v; },
			type: function(o) {
				if (o === null) return "null";
				return typeof(o);
			},
			memoized: function(f) {
				var returns;

				return function() {
					if (arguments.length > 0) throw new TypeError("Memoized functions may not have arguments.");
					//	Ignore 'this'
					if (!returns) {
						returns = { value: f.call(this) };
					}
					return returns.value;
				};
			},
			pipe: pipe,
			split: function(functions) {
				var entries = Object.entries(functions);
				return function(p) {
					var results = entries.map(function(entry) {
						return [entry[0], functions[entry[0]](p)];
					});
					return Object.fromEntries(results);
				}
			},
			result: function() {
				var items = Array.prototype.slice.call(arguments);
				return pipe.apply(this, items.slice(1))(items[0]);
			},
			property: property,
			optionalChain: function(name) {
				return function(p) {
					return (p == null) ? void(0) : p[name];
				}
			},
			is: function(value) {
				return function(v) {
					return v === value;
				}
			},
			returning: function(v) {
				return function() {
					return v;
				};
			},
			conditional: function(test,yes,no) {
				if (arguments.length == 3) {
					return $context.deprecate(function() {
						var condition = test.apply(this,arguments);
						return (condition) ? yes.apply(this,arguments) : no.apply(this,arguments);
					});
				} else {
					var p = test;
					return function(argument) {
						var condition = p.condition(argument);
						return condition ? p.true(argument) : p.false(argument);
					}
				}
			},
			Boolean: {
				map: function(p) {
					return function(b) {
						return (b) ? p.true : p.false
					}
				}
			},
			string: {
				split: function(delimiter) {
					return function(string) {
						return string.split(delimiter);
					}
				},
				repeat: function(number) {
					return function(string) {
						return new Array(number+1).join(string);
					}
				},
				toUpperCase: function(string) {
					return string.toUpperCase();
				},
				match: function(regexp) {
					return function(string) {
						return string.match(regexp);
					}
				},
				startsWith: function(searchString, startPosition) {
					startPosition = startPosition || 0;
					return function(string) {
						var target = string.substring(startPosition);
						return target.substring(0, searchString.length) == searchString;
					}
				},
				endsWith: function(searchString, endPosition) {
					return function(string) {
						if (typeof(string) == "undefined") throw new TypeError("Cannot test whether undefined ends with search string.");
						return string.endsWith(searchString, endPosition);
					}
				},
				replace: function(searchValue, replaceValue) {
					return function(string) {
						return string.replace(searchValue, replaceValue);
					}
				},
				leftPad: function(p) {
					var padding = p.padding || " ";
					return function(string) {
						while(string.length < p.length) {
							string = padding + string;
						}
						return string;
					}
				},
				rightPad: function(p) {
					var padding = p.padding || " ";
					return function(string) {
						while(string.length < p.length) {
							string = string + padding;
						}
						return string;
					}
				}
			},
			Object: {
				entries: Object.entries,
				fromEntries: Object.fromEntries
			},
			Maybe: Maybe,
			Stream: code.Stream({
				$f: {
					Maybe: Maybe,
					pipe: pipe
				}
			}),
			Array: {
				filter: function(f) {
					return function(array) {
						return array.filter(f, this);
					}
				},
				find: function(f) {
					return function(array) {
						return array.find(f, this);
					}
				},
				map: function(f) {
					return function(array) {
						return array.map(f, this);
					}
				},
				concat: function(array) {
					return function(target) {
						return target.concat(array);
					}
				},
				prepend: function(array) {
					return function(target) {
						return array.concat(target);
					}
				},
				groupBy: function(c) {
					return function(array) {
						return $context.$api.Iterable.groupBy({
							array: array,
							group: c.group,
							groups: c.groups,
							codec: c.codec,
							count: false
						}).array().map(function(row) {
							return {
								group: row.group,
								array: row.array
							}
						});
					}
				},
				join: function(string) {
					return function(array) {
						return array.join(string);
					}
				},
				sum: function(attribute) {
					return function(array) {
						return array.reduce(function(rv,element) {
							return rv + attribute(element);
						},0);
					}
				},
				first: function(ordering) {
					return function(ts) {
						/** @type { slime.$api.fp.Maybe<any> } */
						var rv = Maybe.nothing();
						ts.forEach(function(item) {
							if (!rv.present) {
								rv = Maybe.value(item);
							} else if (rv.present && ordering(rv.value)(item) == "BEFORE") {
								rv = Maybe.value(item);
							}
						});
						return rv;
					}
				}
			},
			Arrays: {
				join: function(arrays) {
					return arrays.reduce(function(rv,array) {
						return rv.concat(array);
					},[]);
				}
			},
			Predicate: {
				is: function(value) {
					return function(p) {
						return p === value;
					}
				},
				equals: function(value) {
					return function(p) {
						return p == value;
					}
				},
				/** @type { slime.$api.fp.Exports["filter"]["or"] } */
				or: function() {
					var functions = Array.prototype.slice.call(arguments);
					for (var i=0; i<functions.length; i++) {
						if (typeof(functions[i]) != "function") throw new TypeError("All arguments must be functions; index " + i + " is not.");
					}
					return function(p) {
						for (var i=0; i<functions.length; i++) {
							if (functions[i](p)) return true;
						}
						return false;
					}
				},
				and: function() {
					var functions = Array.prototype.slice.call(arguments);
					for (var i=0; i<functions.length; i++) {
						if (typeof(functions[i]) != "function") throw new TypeError("All arguments must be functions; index " + i + " is not.");
					}
					return function(p) {
						for (var i=0; i<functions.length; i++) {
							if (!functions[i](p)) return false;
						}
						return true;
					}
				},
				not: function(f) {
					return function(p) {
						return !f(p);
					}
				},
				property: function(key, predicate) {
					return pipe(
						property(key),
						predicate
					);
				}
			},
			filter: {
				or: $context.deprecate(Predicate.or),
				and: $context.deprecate(Predicate.and),
				not: $context.deprecate(Predicate.not)
			},
			JSON: {
				stringify: function(p) {
					var replacer = (p && p.replacer) ? p.replacer : void(0);
					//	TODO	is the below correct for 0 and '' ?
					var space = (p && p.space) ? p.space : void(0);
					return function(v) {
						return JSON.stringify(v, replacer, space);
					}
				},
				prettify: function(p) {
					//	TODO	is the below correct for 0 and '' ?
					var space = (p && p.space) ? p.space : void(0);
					return function(v) {
						return JSON.stringify(JSON.parse(v), void(0), space);
					}
				}
			},
			RegExp: {
				modify: function(modifier) {
					return function(regexp) {
						return new RegExp( modifier(regexp.source) );
					}
				},
				exec: function(regexp) {
					return function(string) {
						//	We copy the RegExp to deal with possibilities of multithreaded access
						var copy = new RegExp(regexp.source);
						return Maybe.from(copy.exec(string));
					}
				}
			},
			comparator: {
				create: function(mapping, comparator) {
					return function(a, b) {
						return comparator(mapping(a), mapping(b));
					}
				},
				operators: function(a, b) {
					if (a < b) return -1;
					if (b < a) return 1;
					return 0;
				},
				reverse: function(comparator) {
					return function(a, b) {
						return -(comparator(a,b));
					}
				},
				compose: function() {
					var comparators = Array.prototype.slice.call(arguments);
					return function(a, b) {
						for (var i=0; i<comparators.length; i++) {
							var rv = comparators[i](a, b);
							if (rv !== 0) return rv;
						}
						return 0;
					}
				},
				from: {
					Ordering: function(ordering) {
						return function(a,b) {
							var compare = ordering(a);
							var result = compare(b);
							if (result == "BEFORE") return -1;
							if (result == "EQUAL") return 0;
							if (result == "AFTER") return 1;
							throw new TypeError("Result must be BEFORE, EQUAL, or AFTER.");
						}
					}
				}
			},
			impure: impure.impure,
			world: impure.world,
			object: {
				Update: {
					compose: function(functions) {
						return function(m) {
							for (var i=0; i<functions.length; i++) {
								functions[i](m);
							}
						}
					}
				},
				revise: revise,
				compose: function() {
					var functions = Array.prototype.slice.call(arguments).map(revise);
					return function(p) {
						var rv = p;
						for (var i=0; i<functions.length; i++) {
							rv = functions[i].call(this,rv);
						}
						return rv;
					}
				}
			},
			series: function() {
				var functions = arguments;
				return function() {
					for (var i=0; i<functions.length; i++) {
						var rv = functions[i].apply(this,arguments);
						if (typeof(rv) != "undefined") return rv;
					}
				};
			},
			argument: {
				check: function(p) {
					if (p.type) {
						var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
						return function() {
							if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be " + p.type + ", not undefined.");
							if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be " + p.type + ", not null.");
							if (typeof(arguments[p.index]) != p.type) throw new TypeError(reference + " must be type " + "\"" + p.type + "\"" + ", not " + typeof(arguments[p.index]));
						}
					}
				},
				isString: function(p) {
					var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
					return function() {
						if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
						if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
						if (typeof(arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(arguments[p.index]));
					};
				}
			},
			evaluator: function() {
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
			},
			mutating: $context.old.Function.mutating,
			value: $context.old.Function.value
		});
	}
//@ts-ignore
)($context,$export)
