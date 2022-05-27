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
	 * @param { slime.$api.fp.internal.Exports } $exports
	 */
	function($context,$exports) {
		$exports.Function = $context.old.Function;

		$exports.Function.identity = function(v) { return v; };

		$exports.Function.cast = function(v) { return v; };

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
					returns = { value: f.call(this) };
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

		$exports.Function.optionalChain = function(name) {
			return function(p) {
				return (p == null) ? void(0) : p[name];
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
		};

		$exports.Function.Boolean = {
			map: function(p) {
				return function(b) {
					return (b) ? p.true : p.false
				}
			}
		}

		$exports.Function.string = {
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
			endsWith: function(searchString, endPosition) {
				return function(string) {
					if (typeof(string) == "undefined") throw new TypeError("Cannot test whether undefined ends with search string.");
					return string.endsWith(searchString, endPosition);
				}
			}
		};

		$exports.Function.String = {
			split: $context.deprecate($exports.Function.string.split),
			toUpperCase: $context.deprecate($exports.Function.string.toUpperCase)
		};

		$exports.Function.Object = {
			entries: function(o) {
				return Object.entries(o);
			},
			fromEntries: function(iterable) {
				//	This casting step may not be necessary in higher versions of TypeScript; was not needed in VSCode but was
				//	needed for command line tsc 4.0.5
				/** @type { (p: any) => Iterable<readonly any[]> } */
				var castToIterable = function(p) {
					return p;
				}

				return Object.fromEntries(castToIterable(iterable));
			}
		}

		$exports.Function.Maybe = {
			nothing: function() {
				return { present: false };
			},
			value: function(t) {
				return { present: true, value: t };
			},
			from: function(v) {
				if (v === null) return $exports.Function.Maybe.nothing();
				if (typeof(v) == "undefined") return $exports.Function.Maybe.nothing();
				return $exports.Function.Maybe.value(v);
			},
			map: function(f) {
				return function(maybe) {
					if (maybe.present) {
						return $exports.Function.Maybe.value(f(maybe.value));
					} else {
						return $exports.Function.Maybe.nothing();
					}
				}
			},
			else: function(f) {
				return function(maybe) {
					if (maybe.present) return maybe.value;
					return f();
				}
			}
		}

		$exports.Function.Stream = {
			from: {
				empty: function() {
					return {
						iterate: function() {
							return {
								next: $exports.Function.Maybe.nothing(),
								remaining: $exports.Function.Stream.from.empty()
							}
						}
					}
				},
				array: function(array) {
					/**
					 * @template { any } T
					 * @param { T[] } array
					 * @param { number } index
					 * @returns { slime.$api.fp.Stream<T> }
					 */
					var ArrayStream = function recurse(array,index) {
						return {
							iterate: function() {
								if (index < array.length) {
									return {
										next: $exports.Function.Maybe.value(array[index]),
										remaining: recurse(array, index+1)
									}
								} else {
									return {
										next: $exports.Function.Maybe.nothing(),
										remaining: $exports.Function.Stream.from.empty()
									}
								}
							}
						}
					}

					return ArrayStream(array, 0);
				}
			},
			first: function(stream) {
				return stream.iterate().next;
			},
			collect: function(stream) {
				var rv = [];
				var more = true;
				while(more) {
					var current = stream.iterate();
					if (current.next.present) {
						rv.push(current.next.value);
						stream = current.remaining;
					} else {
						more = false;
					}
				}
				return rv;
			},
			filter: function filter(predicate) {
				return function(stream) {
					return {
						iterate: function() {
							while(true) {
								var current = stream.iterate();
								if (!current.next.present) {
									return {
										next: $exports.Function.Maybe.nothing(),
										remaining: $exports.Function.Stream.from.empty()
									}
								}
								if (current.next.present && predicate(current.next.value)) {
									return {
										next: current.next,
										remaining: filter(predicate)(current.remaining)
									}
								} else {
									stream = current.remaining;
								}
							}
						}
					}
				}
			},
			find: function find(predicate) {
				return $exports.Function.pipe(
					$exports.Function.Stream.filter(predicate),
					$exports.Function.Stream.first
				)
			}
		}

		$exports.Function.Array = {
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
			}
		};

		$exports.Function.Predicate = {
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
			property: function(property, predicate) {
				return $exports.Function.pipe(
					$exports.Function.property(property),
					predicate
				);
			}
		}

		$exports.Function.filter = {
			or: $context.deprecate($exports.Function.Predicate.or),
			and: $context.deprecate($exports.Function.Predicate.and),
			not: $context.deprecate($exports.Function.Predicate.not)
		};

		$exports.Function.JSON = {
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
		};

		$exports.Function.RegExp = {
			modify: function(modifier) {
				return function(regexp) {
					return new RegExp( modifier(regexp.source) );
				}
			}
		}

		$exports.Function.comparator = {
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
			}
		}

		/** @type { slime.$api.fp.Exports["impure"] } */
		$exports.Function.impure = {
			/** @type { slime.$api.fp.Exports["impure"]["revise"] } */
			revise: function(f) {
				if (f === null || f === void(0)) return $exports.Function.identity;
				return function(p) {
					var rv = f.call(this,p);
					return (rv) ? rv : p;
				}
			},
			compose: function() {
				var functions = Array.prototype.slice.call(arguments).map($exports.Function.impure.revise);
				return function(p) {
					var rv = p;
					for (var i=0; i<functions.length; i++) {
						rv = functions[i].call(this,rv);
					}
					return rv;
				}
			},
			ask: $context.events.ask,
			tell: $context.events.tell,
			Update: {
				compose: function(functions) {
					return function(m) {
						for (var i=0; i<functions.length; i++) {
							functions[i](m);
						}
					}
				}
			}
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

		$exports.Function.argument = {
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
	}
//@ts-ignore
)($context,$exports)
