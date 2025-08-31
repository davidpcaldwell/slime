//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
//	TODO	get rid of the wildcarded properties in $exports by adding all properties to $api.d.ts
	/**
	 * @param { Pick<slime.runtime.Engine,"execute"|"debugger"> } $engine
	 * @param { slime.runtime.internal.Code } $slime
	 * @param { slime.runtime.Scope["Packages"] } Packages
	 * @param { slime.loader.Export<slime.$api.internal.Exports> } $export
	 */
	function($engine,$slime,Packages,$export) {
		var script = function(name) {
			var load = function(name,$context) {
				var $exports = {};
				$engine.execute(
					$slime.getRuntimeScript(name),
					{
						$context: $context,
						$exports: $exports,
						$export: function(v) {
							$exports = v;
						}
					},
					null
				);
				return $exports;
			};

			/**
			 *
			 * @param { any } $context
			 * @returns { any }
			 */
			var rv = function($context) {
				return load(name, $context);
			}
			return Object.assign(
				rv,
				{
					thread: function() {
						//	TODO
						throw new Error("Unimplemented.");
					}
				}
			);
		}

		var code = {
			/** @type { slime.runtime.internal.content.Script } */
			content: script("content.js"),
			/** @type { slime.loader.Script<void,slime.$api.internal.flag.Exports> } */
			flag: script("$api-flag.js"),
			/** @type { slime.loader.Script<slime.runtime.internal.mime.Context,slime.$api.mime.Export> } */
			mime: script("$api-mime.js"),
			/** @type { slime.loader.Script<slime.runtime.internal.events.Context,slime.runtime.internal.events.Exports> } */
			events: script("events.js"),
			/** @type { slime.$api.fp.internal.Script } */
			Function: script("$api-Function.js"),
			/** @type { slime.$api.fp.internal.old.Script } */
			Function_old: script("$api-Function_old.js"),
			/** @type { slime.$api.fp.internal.methods.Script } */
			methods: script("$api-fp-methods.js")
		};

		var content = code.content();

		var flag = code.flag();

		var events = code.events({
			deprecate: flag.deprecate
		});

		var Iterable = new function() {
			var getIterator = function(p) {
				if (p.array) {
					return new function() {
						var index = 0;

						this.next = function() {
							if (index < p.array.length) {
								return {
									value: p.array[index++],
									done: false
								};
							} else {
								return {
									done: true
								};
							}
						};
					}
				} else {
					throw new Error("Unimplemented: iterator for " + p);
				}
			}

			/** @type { slime.$api.Global["Iterable"]["groupBy"] } */
			this.groupBy = function(p) {
				var iterator = getIterator(p);

				var rv = {};

				var create = function(key) {
					rv[key] = (p.count) ? 0 : [];
				};

				var add = function(key,value) {
					if (typeof(rv[key]) == "undefined") create(key);
					if (p.count) {
						rv[key]++;
					} else {
						rv[key].push(value);
					}
				};

				var toStringKey = function(group) {
					if (p.codec) {
						group = p.codec.encode(group);
					}
					return group;
				};

				if (p.groups) {
					p.groups.forEach(function(group) {
						create(toStringKey(group));
					});
				}

				var next = iterator.next();
				while(!next.done) {
					var element = next.value;
					var group = p.group(element);
					var key = toStringKey(group);
					add(key,element);
					next = iterator.next();
				}

				return (function() {
					var list;

					return {
						array: function() {
							if (!list) {
								list = [];
								for (var x in rv) {
									var decode = (p.codec && p.codec.decode) ? p.codec.decode : function(x) { return x; };
									var group = decode(x);
									var element = { group: group };
									if (p.count) {
										element.count = rv[x];
									} else {
										element.array = rv[x];
									}
									list.push(element);
								}
								return list;
							}
						}
					}
				})();
			};

			this.match = function(p) {
				var first = p.left;
				var second = p.right;
				var firstRemain = [];
				var secondRemain = second.slice();
				var pairs = [];
				for (var i=0; i<first.length; i++) {
					var match = null;
					for (var j=0; j<secondRemain.length && !match; j++) {
						match = p.matches(first[i],secondRemain[j]);
						if (match) {
							pairs.push({
								left: first[i],
								right: secondRemain[j]
							});
							secondRemain.splice(j,1);
						}
					}
					if (!match) firstRemain.push(first[i]);
				}
				if (p.unmatched && p.unmatched.left) {
					firstRemain.forEach(function(item) {
						p.unmatched.left(item);
					});
				}
				if (p.unmatched && p.unmatched.right) {
					secondRemain.forEach(function(item) {
						p.unmatched.right(item);
					});
				}
				if (p.matched) pairs.forEach(function(pair) {
					p.matched(pair);
				});
				return {
					unmatched: {
						left: firstRemain,
						right: secondRemain
					},
					matched: pairs
				};
			};
		};

		/** @type { slime.$api.object.Exports["defineProperty"] } */
		var defineProperty = function(p) {
			return function(o) {
				var r = Object.assign(o, Object.fromEntries([ [p.name, void(0)] ]));
				Object.defineProperty(
					r,
					p.name,
					p.descriptor
				);
				return r;
			}
		};

		var functions = (function() {
			var old = code.Function_old({ deprecate: flag.deprecate });

			var current = code.Function({
				$api: { Iterable: Iterable },
				events: events,
				old: old,
				deprecate: flag.deprecate,
				script: script
			});

			var methods = code.methods({
				library: {
					Object: {
						defineProperty: defineProperty
					}
				}
			});

			/** @type { slime.$api.Global["fp"] } */
			var fp = Object.assign(current, { methods: methods });

			/** @type { slime.$api.Global["Function"] } */
			var Function = Object.assign(old.create, old.Function);

			return /** @type { { fp: slime.$api.Global["fp"], Function: slime.$api.Global["Function"] } } */(
				{ fp: fp, Function: Function }
			);
		})();

		var fp = functions.fp;

		var global = {
			get: function(name) {
				//	TODO	note  that modern JavaScript also has `globalThis`
				var global = (function() { return this; })();
				return global[name];
			}
		};

		var debug = {
			//	TODO	try to get rid of ignore below
			//@ts-ignore
			disableBreakOnExceptionsFor: function(f) {
				if ($engine.debugger) {
					var rv = function() {
						var enabled = $engine.debugger.isBreakOnExceptions();
						if (enabled) {
							$engine.debugger.setBreakOnExceptions(false);
						}
						try {
							return f.apply(this,arguments);
						} finally {
							if (enabled) {
								$engine.debugger.setBreakOnExceptions(true);
							}
						}
					}
					return rv;
				} else {
					//	TODO	unclear what should be done here, but forcing a debugger pause is probably not right
					//	debugger;
					return f;
				}
			}
		};

		var Filter = {
			and: flag.deprecate(fp.Predicate.and),
			or: flag.deprecate(fp.Predicate.or),
		};

		var Constructor = {
			invoke: function(p) {
				//	TODO	sometimes, empty arguments may not be legal, but we put this here for now
				//@ts-ignore
				if (!p.arguments) p.arguments = [];
				var code = "new p.constructor(" +
					p.arguments.map(function() {
						return "p.arguments[" + arguments[1] + "]";
					}).join(",")
				+ ")";
				//	TODO	in contexts like Nashorn, can we use a different API to execute this script? Currently, ncdbg rejects the script name created by this.
				return eval(code);
			}
		};

		var Key = {
			/** @type { slime.$api.Global["Key"]["by"] } */
			//@ts-ignore
			by: function(p) {
				/** @type { ReturnType<slime.$api.Global["Key"]["by"]> } */
				var rv = {};

				var create = function(key) {
					//@ts-ignore
					rv[key] = (p.count) ? 0 : [];
				};

				var add = function(key,value) {
					if (p.count) {
						//@ts-ignore
						rv[key]++;
					} else {
						rv[key].push(value);
					}
				};

				var toStringKey = function(key) {
					if (p.codec) {
						key = p.codec.encode(key);
					}
					return key;
				}

				if (p.keys) {
					p.keys.forEach(function(key) {
						create(toStringKey(key));
					});
				}

				p.array.forEach(function(element) {
					var key = toStringKey(p.key(element));
					if (!rv[key]) create(key);
					add(key,element);
				});

				//@ts-ignore
				return rv;
			}
		};

		var arrayToOldProperties = (function implementProperties() {
			var withPropertiesResult = function(was) {
				return function() {
					var rv = was.apply(this,arguments);
					decorateArray(rv);
					return rv;
				};
			};

			var decorateArray = function(array) {
				["filter"].forEach(function(name) {
					array[name] = withPropertiesResult(Array.prototype[name]);
				});
				array.object = function() {
					return _Object({ properties: this });
				};
			};

			return function(array) {
				decorateArray(array);
				return array;
			}
		})();

		var Properties = function() {
			var array = (function() {
				if (arguments.length == 0) return [];
				if (!arguments[0]) throw new TypeError("Must be object.");
				if (arguments[0].array) return arguments[0].array;
				if (arguments[0].object) {
					var rv = [];
					for (var x in arguments[0].object) {
						//	TODO	could use Object.defineProperty to defer evaluation of o[x]
						rv.push({ name: x, value: arguments[0].object[x] });
					}
					return rv;
				}
				throw new Error();
			}).apply(null, arguments);

			return arrayToOldProperties(array);
		};

		var _Object = Object.assign(
			/**
			 * @param { { properties: {name: string, value: any }[] } } p
			 * @returns { { [x: string]: any } }
			 */
			function(p) {
				var rv = {};
				if (p.properties) {
					for (var i=0; i<p.properties.length; i++) {
						rv[p.properties[i].name] = p.properties[i].value;
					}
				}
				return rv;
			},
			/** @type { slime.$api.object.Exports } */
			({
				compose: function() {
					var args = [{}];
					for (var i=0; i<arguments.length; i++) {
						args.push(arguments[i]);
					}
					return Object.assign.apply(Object,args);
				},
				properties: function(o) {
					//	Returns an array consisting of:
					//	name:
					//	value:
					//		See http://www.ecma-international.org/ecma-262/5.1/#sec-11.2.1 property accessors
					//		Name 'value' comes because these are defined in terms of [[GetValue]]
					var rv = [];
					for (var x in o) {
						//	TODO	could use Object.defineProperty to defer evaluation of o[x]
						rv.push({ name: x, value: o[x] });
					}
					return arrayToOldProperties(rv);
				},
				optional: function(v) {
					if (arguments.length == 0) throw new TypeError();
					if (arguments.length == 1) throw new TypeError();
					var rv = v;
					for (var i=1; i<arguments.length; i++) {
						if (rv === null || typeof(rv) == "undefined") return void(0);
						//	string, boolean, number; just fail for now, pending further definition
						if (typeof(rv) != "object") throw new TypeError();
						rv = rv[arguments[i]];
					}
					return rv;
				},
				values: {
					//@ts-ignore
					map: function(f) {
						return function(o) {
							var rv = {};
							for (var x in o) {
								//@ts-ignore
								rv[x] = f(o[x]);
							}
							return rv;
						}
					}
				},
				defineProperty: defineProperty,
				maybeDefineProperty: function(p) {
					return function(o) {
						//@ts-ignore
						var m = p.descriptor(o);
						var r = Object.assign(o);
						if (m.present) {
							var r = Object.assign(o, Object.fromEntries([ [p.name, void(0)] ]));
							Object.defineProperty(
								r,
								p.name,
								m.value
							);
						}
						return r;
					}
				}
			})
		);

		var _Function = {
			call: function(f,target) {
				return f.apply(target, Array.prototype.slice.call(arguments).slice(2));
			}
		}

		var _Array = {
			build: function(f) {
				var rv = [];
				f(rv);
				return rv;
			}
		};

		var Value = function(v,name) {
			var $exports_Object_property = function() {
				var rv = this;
				for (var i=0; i<arguments.length; i++) {
					rv = rv[arguments[i]];
				}
				return rv;
			};

			return {
				require: function() {
					if (!v) {
						throw new TypeError(name + " is required");
					}
				},
				property: function() {
					return Value(
						$exports_Object_property.apply(v,arguments),
						( name || "" ) + "." + Array.prototype.join.call(arguments,".")
					)
				},
			};
		};

		/**
		 * @template T
		 * @param { { name: string, extends: new () => Error } } p
		 * @returns { new (message: string, properties: object) => T }
		 */
		var ErrorType = function(p) {
			var Supertype = (p.extends) ? p.extends : Error;
			/**
			 * @constructor
			 * @param { string } message
			 * @param { object } [properties]
			 */
			function Subtype(message,properties) {
				if (this instanceof Subtype) {
					this.name = p.name;
					this.message = (typeof(message) == "string") ? message : "";
					var stack = new Error("__message__").stack;
					var errorTypePattern = /^Error/;
					var messagePattern = /__message__/;
					var isChromeFormat = errorTypePattern.test(stack) && messagePattern.test(stack);
					if (isChromeFormat) {
						stack = stack.replace(errorTypePattern, this.name).replace(messagePattern, this.message);
					} else {
						//	leave it alone for now
						//	untested: Rhino, Nashorn, GraalVM, Node.js
						//	Rhino appears with current implementation to dump the stack without the type / message fields, but this
						//	may be affected by our code intercepting it; Rhino's underlying code may have changed
						//	TODO	get these tested
					}
					this.stack = stack;
					Object.assign(this, properties);
				} else {
					return new Subtype(message);
				}
			}
			Subtype.prototype = debug.disableBreakOnExceptionsFor(function() {
				var rv = new Supertype();
				//delete rv.stack;
				return rv;
			})();
			var rv = Subtype;
			//@ts-ignore
			return rv;
		};

		/** @type { slime.$api.Global["Error"] } */
		var _Error = {
			old: {
				//	TODO	see whether we can get rid of this
				//@ts-ignore
				Type: ErrorType,
				/** @type { slime.$api.Global["Error"]["old"]["isType"] } */
				isType: function(type) {
					//@ts-ignore
					return function(e) {
						return e instanceof type;
					}
				}
			},
			/**
			 * @template { string } N
			 * @template { Error } S
			 * @template { {} } P
			 *
			 * @param { slime.$api.error.CustomDefinition<N,S,P> } p
			 * @returns { slime.$api.error.CustomType<N,P> }
			 */
			type: function me(p) {
				/** @type { slime.$api.error.CustomType<N,P> } */
				var CustomError = function factory(properties) {
					var invokedAsConstructor = this instanceof CustomError;
					if (!invokedAsConstructor) {
						var message = p.getMessage(properties);
						/** @type { slime.$api.error.Custom<N,P> } */
						var rv = Object.assign(
							Object.create(prototype),
							{
								name: void(0),
								message: void(0),
								properties: void(0)
							}
						);
						rv.name = p.name;
						rv.message = message;
						if (Error["captureStackTrace"]) {
							Error["captureStackTrace"](rv, CustomError);
						} else if (rv.stack) {
							//	do nothing
						} else {
							//	do nothing for now
						}
						rv.properties = properties;
						return rv;
					} else {
						return CustomError(properties);
					}
				};

				var prototype = Object.create(
					p.extends || Error.prototype,
					{
						constructor: {
							value: CustomError,
							enumerable: false,
							writable: true,
							configurable: true
						}
					}
				);

				Object.defineProperty(CustomError, "prototype", {
					value: prototype,
					enumerable: false,
					writable: false,
					configurable: false
				});

				return CustomError;
			}
		}

		var TODO = function(p) {
			var Type = _Error.type({
				name: "TODO",
				/** @type { (p: { message: slime.$api.fp.Thunk<string> }) => string } */
				getMessage: function(p) {
					return (p && p.message) ? p.message() : "TODO";
				}
			})

			return function() {
				throw Type(p);
			}
		}

		var Events = Object.assign(
			flag.deprecate(events.exports.emitter),
			{
				Function: flag.deprecate(events.exports.Function),
			}
		);

		var mime = code.mime({
			Function: fp,
			deprecate: flag.deprecate
		});

		//	TODO	switch implementation to use load()
		var threads = (function($context) {
			var $exports = {
				steps: void(0)
			};
			$engine.execute($slime.getRuntimeScript("threads.js"), { $context: $context, $exports: $exports }, null);
			return $exports;
		})({ Events: Events });

		var scripts = (
			function() {
				/** @type { slime.runtime.internal.scripts.Exports } */
				var rv;
				$engine.execute(
					$slime.getRuntimeScript("scripts.js"),
					{
						Packages: Packages,
						$engine: $engine,
						fp: fp,
						apiForScripts: function() {
							return $exports;
						},
						$export: function(v) {
							rv = v;
						}
					},
					null
				);
				return rv;
			}
		)();

		/** @type { Parameters<typeof $export>[0]["exports"] } */
		var $exports = {
			engine: $engine,
			content: content,
			deprecate: flag.deprecate,
			experimental: flag.experimental,
			flag: flag.flag,
			events: events.exports,
			Iterable: Iterable,
			fp: fp,
			global: global,
			debug: debug,
			Filter: Filter,
			Constructor: Constructor,
			Key: Key,
			Properties: Properties,
			Object: _Object,
			Function: Object.assign(functions.Function, _Function),
			Array: _Array,
			Value: Value,
			Error: _Error,
			TODO: TODO,
			Events: Events,
			threads: threads,
			mime: mime,
			scripts: scripts.api
		};

		$export({
			scripts: {
				platform: scripts.platform,
				internal: scripts.internal
			},
			exports: $exports
		});
	}
//@ts-ignore
)($engine,$slime,Packages,$export)
