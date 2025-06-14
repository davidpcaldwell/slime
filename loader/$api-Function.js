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
			Stream: $context.script("$api-fp-stream.js"),
			/** @type { slime.$api.fp.internal.impure.Script } */
			impure: $context.script("$api-fp-impure.js")
		};

		var identity = function(v) { return v; };

		var Maybe = (
			/** @type { () => slime.$api.fp.Exports["Maybe"] } */
			function() {
				/** @type { slime.$api.fp.Nothing } */
				var nothing = { present: false };
				/** @type { slime.$api.fp.Exports["Maybe"]["from"]["some"] } */
				var value = function(t) {
					return { present: true, value: t };
				};
				return {
					from: {
						nothing: function() { return nothing; },
						some: value,
						value: function(v) {
							if (v === null) return nothing;
							if (typeof(v) == "undefined") return nothing;
							return value(v);
						}
					},
					map: function(f) {
						return function(maybe) {
							if (maybe.present) {
								return value(f(maybe.value));
							} else {
								return nothing;
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
					},
					pipe: function(fs) {
						var array = Array.prototype.slice.call(arguments);
						return function(a) {
							/** @type { any } */
							var rv = a;
							for (var i=0; i<array.length; i++) {
								var next = array[i](rv);
								if (!next.present) return Maybe.from.nothing();
								rv = next.value;
							}
							return Maybe.from.some(rv);
						}
					}
				}
			}
		)();

		/** @type { slime.$api.fp.Exports["Partial"] } */
		var Partial = {
			from: {
				loose: function(f) {
					return function(p) {
						return Maybe.from.value(f(p));
					}
				}
			},
			match: function(v) {
				return function(p) {
					var present = v.if(p);
					return present ? Maybe.from.some(v.then(p)) : Maybe.from.nothing();
				}
			},
			else: function(c) {
				return function(p) {
					var maybe = c.partial(p);
					if (maybe.present) return maybe.value;
					return c.else(p);
				}
			},
			/** @type { slime.$api.fp.Exports["Partial"]["impure"] } */
			impure: {
				exception: function(nothing) {
					return function(partial) {
						return function(p) {
							var maybe = partial(p);
							if (!maybe.present) {
								var error = nothing(p);
								throw error;
							}
							return maybe.value;
						}
					}
				},
				old: {
					exception: function(p) {
						return function(t) {
							var tried = p.try(t);
							if (tried.present) return tried.value;
							throw p.nothing(t);
						}
					}
				}
			}
		};

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

		var stream = code.Stream({
			$f: {
				Maybe: Maybe,
				pipe: pipe
			}
		});

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

		/** @type { slime.$api.fp.Exports["Predicate"] } */
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
			and: function recurse() {
				if (arguments.length == 1 && arguments[0] instanceof Array) {
					return recurse.apply(this, arguments[0]);
				}
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

		var now_map = function() {
			if (arguments.length == 0) throw new TypeError();
			var items = Array.prototype.slice.call(arguments);
			return pipe.apply(this, items.slice(1))(items[0]);
		}

		/** @type { <T>(ordering: slime.$api.fp.Ordering<T>) => slime.$api.fp.CompareFn<T> } */
		var orderingToJs = function(ordering) {
			return function(a,b) {
				var result = ordering([a,b]);
				if (result.present) {
					return (result.value) ? -1 : 1;
				} else {
					return 0;
				}
			}
		};

		var mapping = (function() {
			/** @type { slime.$api.fp.internal.mapping.Script } */
			var script = $context.script("$api-fp-Mapping.js");
			return script({
				deprecate: $context.deprecate
			});
		})();

		var impure = code.impure({
			now: now_map,
			Maybe: Maybe,
			Partial: Partial,
			pipe: pipe,
			events: $context.events,
			stream: stream.impure
		});

		$export({
			identity: identity,
			cast: {
				unsafe: identity,
				guarded: function(guard) {
					return function(t) {
						if (guard(t)) return t;
						throw new TypeError();
					}
				},
				maybe: function(guard) {
					return function(t) {
						if (guard(t)) return Maybe.from.some(t);
						return Maybe.from.nothing();
					}
				}
			},
			type: function(o) {
				if (o === null) return "null";
				return typeof(o);
			},
			Mapping: mapping.Mapping,
			returning: function(v) {
				return function() {
					return v;
				};
			},
			mapAllTo: function(v) {
				return function(p) {
					return v;
				}
			},
			split: function(functions) {
				var entries = Object.entries(functions);
				return function(p) {
					var results = entries.map(function(entry) {
						return [entry[0], functions[entry[0]](p)];
					});
					return Object.fromEntries(results);
				}
			},
			pipe: pipe,
			Thunk: {
				map: function(thunk) {
					var functions = Array.prototype.slice.call(arguments,1);
					return function() {
						var rv = thunk();
						functions.forEach(function(f) {
							rv = f(rv);
						});
						return rv;
					}
				},
				value: function() {
					var args = Array.prototype.slice.call(arguments);
					return function() {
						return now_map.apply(this, args);
					}
				},
				now: function(thunk) {
					var maps = Array.prototype.slice.call(arguments, 1);
					var rv = thunk();
					maps.forEach(function(map) {
						rv = map(rv);
					});
					return rv;
				}
			},
			Predicate: Predicate,
			filter: {
				or: $context.deprecate(Predicate.or),
				and: $context.deprecate(Predicate.and),
				not: $context.deprecate(Predicate.not)
			},
			is: function(value) {
				return function(v) {
					return v === value;
				}
			},
			property: property,
			optionalChain: function(name) {
				return function(p) {
					return (p == null) ? void(0) : p[name];
				}
			},
			curry: function(c) {
				return function(f) {
					return function(p) {
						//@ts-ignore
						return f(Object.assign({},p,c));
					}
				}
			},
			flatten: function(k) {
				return function(f) {
					return function(v) {
						return f(
							Object.fromEntries([
								[k,v]
							])
						);
					}
				}
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
				trim: function(string) {
					return string.trim();
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
				},
				format: function(p) {
					var content = p.mask.split("()");
					if (content.length - 1 != p.values.length) throw new TypeError(
						"Mask has " + String(content.length-1) + " placeholders, but " + p.values.length + " placeholders supplied."
					);
					return function(t) {
						var rv = content[0];
						for (var i=0; i<p.values.length; i++) {
							rv += p.values[i](t);
							rv += content[i+1];
						}
						return rv;
					}
				}
			},
			Object: {
				property: {
					update: function(p) {
						return function(target) {
							var rv = Object.assign(
								{},
								target
							);
							rv[p.property] = p.change(rv[p.property]);
							return rv;
						}
					},
					//@ts-ignore
					set: function(p) {
						return function(target) {
							var rv = Object.assign({}, target);
							for (var x in p) {
								var value = p[x](rv);
								//@ts-ignore
								rv[x] = value;
							}
							return rv;
						}
					},
					maybe: function() {
						var keys = arguments;
						var isNothing = function(v) { return !Maybe.from.value(v).present };
						return function(object) {
							var rv = object;
							for (var i=0; i<keys.length; i++) {
								var value = rv[keys[i]];
								if (isNothing(value)) return Maybe.from.nothing();
								rv = value;
							}
							return isNothing(rv) ? Maybe.from.nothing() : Maybe.from.some(rv);
						}
					}
				},
				entries: Object.entries,
				fromEntries: Object.fromEntries
			},
			Maybe: Maybe,
			Partial: Partial,
			switch: function(cases) {
				return function(p) {
					for (var i=0; i<cases.length; i++) {
						var r = cases[i](p);
						if (r.present) return r;
					}
					return Maybe.from.nothing();
				}
			},
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
				some: function(f) {
					return function(array) {
						return array.some(f, this);
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
				}
			},
			Arrays: {
				join: function(arrays) {
					return arrays.reduce(function(rv,array) {
						return rv.concat(array);
					},[]);
				}
			},
			Stream: stream.exports,
			Ordering: {
				from: {
					operators: function(two) {
						if (two[0] < two[1]) return Maybe.from.some(true);
						if (two[0] > two[1]) return Maybe.from.some(false);
						return Maybe.from.nothing();
					},
					prioritize: function(p) {
						return function(two) {
							var a = p.predicate(two[0]);
							var b = p.predicate(two[1]);
							if (a && !b) return Maybe.from.some(true === p.value);
							if (b && !a) return Maybe.from.some(false === p.value);
							return Maybe.from.nothing();
						}
					},
					map: function(p) {
						return function(two) {
							return p.ordering(
								//@ts-ignore
								two.map(p.map)
							);
						}
					}
				},
				array: {
					first: function(ordering) {
						return function(ts) {
							/** @type { slime.$api.fp.Maybe<any> } */
							var rv = Maybe.from.nothing();
							ts.forEach(function(item) {
								if (!rv.present) {
									rv = Maybe.from.some(item);
								} else {
									if (rv.present) {
										var compared = ordering([rv.value,item]);
										if (compared.present && compared.value === false) {
											rv = Maybe.from.some(item);
										}
									}
								}
							});
							return rv;
						}
					},
					sort: function(ordering) {
						return function(array) {
							return Array.prototype.slice.call(array).sort(orderingToJs(ordering));
						}
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
					Ordering: orderingToJs
				}
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
						return Maybe.from.value(copy.exec(string));
					}
				}
			},
			now: Object.assign(now_map, {
				invoke: now_map,
				map: now_map
			}),
			result: now_map,
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
			value: $context.old.Function.value,
			impure: impure.impure,
			world: impure.world
		});
	}
//@ts-ignore
)($context,$export)
