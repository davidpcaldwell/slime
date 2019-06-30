//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var log = ($context.log) ? $context.log : function(){};

//	We have an object called Object in this file, so this
var defineProperty = (function() { return this.Object.defineProperty; })();

var Verify = function(scope,vars) {
	var Value = function(v,name) {
		var prefix = (name) ? (name + " ") : "";

		this.toString = function() {
			return "Verify(" + v + ")";
		}

		if (typeof(v) != "object" || !v) {
			this.name = name;
			this.value = v;
		}

		if (typeof(v) == "string") {
			var expression = (name) ? name : "\"" + v + "\"";
			this.length = new Value(v.length, expression + ".length");
		}

		var toLiteral = function(v) {
			if (typeof(v) == "string") return "\"" + v + "\"";
			return String(v);
		}

		var represent = function(value) {
			if (value instanceof Value) {
				return value;
			} else {
				return {
					value: value,
					name: toLiteral(value)
				};
			}
		}

		var is = function(value,not) {
			var specified = represent(value);
			scope.test(function() {
				var success = (not) ? v !== specified.value : v === specified.value;
				var message = prefix + (function() {
					if (!not && success) return "is " + specified.name;
					if (!not && !success) return "is " + toLiteral(v) + ", but should be " + specified.name;
					if (not && success) return "is " + toLiteral(v) + ", not " + specified.name;
					if (not && !success) return "is " + toLiteral(v) + ", but should not be.";
				})();
				return {
					success: success,
					message: message
				}
			});
		}

		var isType = function(value) {
			scope.test(function() {
				var type = (function() {
					if (v === null) return "null";
					return typeof(v);
				})();
				return new function() {
					this.success = (type == value);
					this.message = prefix + ((this.success)
						? "is type " + value
						: "is type " + type + ", not " + value
					);
				};
			});
		}

		var isEqualTo = function(value,not) {
			var specified = represent(value);
			scope.test(function() {
				var success = (not) ? v != specified.value : v == specified.value;
				var message = prefix + (function() {
					if (!not && success) return "is equal to " + specified.name;
					if (!not && !success) return "is " + toLiteral(v) + ", which is not equal to " + specified.name;
					if (not && success) return "is not equal to " + specified.name;
					if (not && !success) return "is " + toLiteral(v) + ", which equals " + specified.name + ", but should not.";
				})();
				return {
					success: success,
					message: message
				}
			});
		};

		this.is = function(value) {
			is(value);
		};
		this.is.not = function(value) {
			is(value,true);
		};
		this.is.type = function(value) {
			isType(value);
		}

		this.is.equalTo = function(value) {
			return isEqualTo(value,false);
		}
		this.is.not.equalTo = function(value) {
			return isEqualTo(value,true);
		}

//		this.isUndefined = $api.deprecate(function() {
//			is(void(0));
//		});
//
//		this.isNotEqualTo = $api.deprecate(function(value) {
//			return isEqualTo(value,true);
//		});
	};

	var prefixFactory = function(name) {
		return function(x) {
			var isNumber = function(x) {
				return !isNaN(Number(x));
			};

			var access = (isNumber(x)) ? "[" + x + "]" : "." + x;
			return (name) ? (name + access) : access;
		};
	}

	var wrapMethod = function(o,x,name) {
		if (arguments.length != 3) throw new Error();
		var prefix = prefixFactory(name);
		var wrapped = function() {
			var argumentToString = function(v) {
				if (typeof(v) == "string") return "\"" + v + "\"";
				return String(v);
			}
			var strings = Array.prototype.map.call(arguments,argumentToString);
			var name = prefix(x)+"(" + strings.join() + ")";
//				try {
				var returned = o[x].apply(o,arguments);
				var value = rv(returned,name);
//					value.threw = new DidNotThrow(returned,name);
				return value;
//				} catch (e) {
//					return new DidNotReturn(e,name);
//				}
		};
		wrapObject.call(wrapped,o[x]);
		return wrapped;
	};

	var wrapProperty = function(o,x,name) {
		if (arguments.length != 3) throw new Error("arguments[0] = " + o + " arguments[1] = " + x + " arguments.length=" + arguments.length);
		var prefix = prefixFactory(name);
		defineProperty(this, x, {
			get: function() {
				return rv(o[x],prefix(x));
			}
		});
	};

	var wrapObject = $api.debug.disableBreakOnExceptionsFor(function(o,name) {
		for (var x in o) {
			try {
				var noSelection = (o.tagName == "INPUT" && (o.type == "button" || o.type == "checkbox"));
				if (noSelection && x == "selectionDirection") continue;
				if (noSelection && x == "selectionEnd") continue;
				if (noSelection && x == "selectionStart") continue;
				if (typeof(o) == "function" && !o.hasOwnProperty(x)) continue;
				var value = o[x];
				if (typeof(value) == "function") {
					this[x] = wrapMethod(o,x,name);
				} else {
					if (x != "is" && x != "evaluate") {
						wrapProperty.call(this,o,x,name);
					}
				}
			} catch (e) {
			}
		}

		if (o instanceof Array) {
			wrapProperty.call(this,o,"length",name);
		}
		if (o instanceof Date) {
			this.getTime = wrapMethod(o,"getTime",name);
		}
		if (o instanceof Error && !this.message) {
			wrapProperty.call(this,o,"message",name);
		}
	});

	var Object = function(o,name) {
		Value.call(this,o,name);

		wrapObject.call(this,o,name);

		this.evaluate = function(f) {
			var DidNotReturn = function(e,name) {
				var delegate = new Value(void(0),name);

				for (var x in delegate) {
					this[x] = function() {
						scope.test({
							success: function() { return false; },
							error: e,
							message: function(success) {
								return name + " threw " + e;
							}
						});
					}
				}

				this.threw = new Object(e,name + " thrown");
				this.threw.type = function(type) {
					scope.test({
						success: function() { return e instanceof type; },
						message: function(success) {
							if (success) return name + " threw expected " + type.name;
							return "Threw " + e + ", not " + new type().name;
						}
					});
				};
				this.threw.nothing = function() {
					scope.test({
						success: function() { return false; },
						message: function(success) {
							return name + " threw " + e;
						}
					});
				}
			};

			var DidNotThrow = function(returned,name) {
				var delegate = new Value(void(0),name);

				for (var x in delegate) {
					this[x] = function() {
						scope.test({
							success: function() { return false; },
							message: function(success) {
								return name + " did not throw; returned " + returned;
							}
						});
					}
				}

				this.nothing = function() {
					scope.test({
						success: function() { return true; },
						message: function(success) {
							return name + " did not error. (returned: " + returned + ")";
						}
					});
				};

				this.type = function(type) {
					scope.test({
						success: function() { return false; },
						message: function(success) {
							return name + " did not throw expected error; returned " + returned;
						}
					})
				}
			};

			try {
				var mapped = f.call(o,o);
				var value = rv(mapped,((name) ? name : "")+"{" + f + "}");
				value.threw = new DidNotThrow(mapped,"{" + f + "}");
				return value;
			} catch (e) {
				return new DidNotReturn(e,"{" + f + "}");
			}
		};
		this.evaluate.property = function(property) {
			return rv(o[property], ((name) ? name : "")+"." + property);
		}
	};

	var delegates = [];

	var rv = function(value,name) {
		for (var i=0; i<delegates.length; i++) {
			if (delegates[i].accept(value)) {
				return delegates[i].wrap(value);
			}
		}
		if (value && typeof(value) == "object") {
			var localName = (function() {
				if (name) return name;
				for (var x in vars) {
					if (vars[x] == value) {
						return x;
					}
				}
			})();
			return new Object(value,localName);
		}
		return new Value(value,name);
	};

	for (var x in vars) {
		if (typeof(vars[x]) == "function") {
			rv[x] = (function(delegate,name) {
				return function() {
					//	TODO	this cannot be right, should not depend on Slim
					var v = delegate.apply(inonit.slim.getDocument(),arguments);
					//	TODO	the below does a poor job at creating the prefix to use
					return rv(v,name);
				}
			})(vars[x],x)
		} else {
			rv[x] = rv(vars[x]);
		}
	}
	return rv;
};

$exports.Verify = Verify;

var TestExecutionProcessor = (function() {
	//	TODO	would like to move this adapter to another file, but would need to alter callers to load unit.js as module first

	var adaptAssertion = new function() {
		var BooleanTest = function(b) {
			var MESSAGE = function(success) {
				return (success) ? "Success." : "FAILED!";
			};

			return $api.deprecate(function() {
				return {
					success: b,
					message: MESSAGE(b)
				}
			});
		};

		this.assertion = function(assertion) {
			if (typeof(assertion) == "function") return assertion;
			if (typeof(assertion) == "boolean") {
				return BooleanTest(assertion);
			} else if (typeof(assertion) == "undefined") {
				throw new TypeError("Assertion is undefined.");
			} else if (assertion === null) {
				return BooleanTest(assertion);
			} else if (
					(typeof(assertion) == "object" && assertion != null && typeof(assertion.success) == "boolean")
					|| (typeof(assertion) == "object" && assertion != null && assertion.success === null)
				) {
				return (function(object) {
					var MESSAGE_FOR_MESSAGES = function(assertion_messages) {
						return function(success) {
							var messages = {
								success: assertion_messages.success,
								failure: assertion_messages.failure
							};
							if (messages && typeof(messages.success) == "string") {
								messages.success = (function(value) {
									return function() {
										return value;
									}
								})(messages.success)
							}
							if (messages && typeof(messages.failure) == "string") {
								messages.failure = (function(value) {
									return function() {
										return value;
									}
								})(messages.failure)
							}
							return (success) ? messages.success() : messages.failure();
						}
					};
					return $api.deprecate(function() {
						return {
							success: object.success,
							error: object.error,
							message: MESSAGE_FOR_MESSAGES(object.messages)(object.success)
						}
					});
				})(assertion);
			} else if (typeof(assertion) == "object" && typeof(assertion.success) == "function") {
				if (typeof(assertion.message) == "function") {
					return (function(was) {
						return $api.deprecate(function() {
							var success = was.success();
							var message = was.message(success);
							return {
								success: success,
								message: message,
								error: was.error
							};
						})
					})(assertion);
				} else if (typeof(assertion.messages) == "object") {
					return (function(was) {
						return $api.deprecate(function() {
							var success = was.success();
							return {
								success: success,
								message: (success) ? was.messages.success() : was.messages.failure(),
								error: was.error
							};
						});
					})(assertion);
				} else {
					throw new TypeError("Assertion object with success but no messages: " + Object.keys(assertion));
				}
			} else if (true || typeof(assertion) != "object" || typeof(assertion.success) != "function") {
				var error = new TypeError("Assertion is not valid format; see this error's 'assertion' property for incorrect value");
				error.assertion = assertion;
				throw error;
			}
		};

		this.result = function(result) {
			if (typeof(result) == "boolean") {
				return $api.deprecate((function(b) {
					return {
						success: b,
						message: (b) ? "Success." : "FAILED!"
					};
				}))(result);
			}
			return result;
		}
	};

	var Scope = function(o) {
		var success = true;

		//	IE8-compatible implementation below
		//		var self = this;
		//		this.success = true;
		//		var fail = function() {
		//			debugger;
		//			self.success = false;
		//		}

		var checkForFailure = function(detail) {
			if (typeof(detail.success) != "undefined") {
				if (!detail.success) {
					debugger;
					success = false;
				}
			}
		};

		var process = function(type,detail) {
			o.events.fire(type,detail);
			checkForFailure(detail);
		}

		this.test = function(assertion) {
			var getResult = function(assertion) {
				assertion = adaptAssertion.assertion(assertion);
				var result = assertion();
				result = adaptAssertion.result(result);
				return result;
			};

			process("test",getResult(assertion));
		};

		this.error = function(e) {
			process("test",{
				success: false,
				message: "Uncaught exception: " + e,
				error: e
			});
		}

		this.verify = new Verify(this);

		defineProperty(this,"success",{
			get: function() {
				return success;
			}
		});

		this.fire = function(type,detail) {
			process(type,detail);
		}

		this.checkForFailure = function(e) {
			checkForFailure(e.detail);
		}
	};

	return Scope;
})();

$exports.TestExecutionProcessor = TestExecutionProcessor;

(function() {
	var copy = function(o) {
		var rv = {};
		for (var x in o) {
			rv[x] = o[x];
		}
		return rv;
	}

	var Part = function(definition,context) {
		//	TODO	what if caller does not use 'new'?
		var events = $api.Events({
			source: this,
			parent: (context && context.events) ? context.events : null
		});

		this.id = (context) ? context.id : null;

		this.name = (function() {
			if (definition && definition.name) return definition.name;
			if (context && context.id) return context.id;
			if (!context) return null;
		})();

		var find = (function(property) {
			if (definition && definition[property]) return definition[property];
			if (this[property] && property != "promise") {
				return $api.deprecate(function() {
					return this[property];
				}).call(this);
			}
		}).bind(this);

		var EVENT = (function() {
			return { id: (context && context.id ) ? context.id : null, name: this.name };
		}).bind(this);

		var destroy = (function(scope) {
			try {
				var destroy = find("destroy");
				if (destroy) destroy.call(this,scope);
			} catch (e) {
				//	TODO	what to do on destroy error?
//				vscope.error(e);
			}
		}).bind(this);

		//	Do not use old automatically-configured listeners property of event source; rather, use new listeners
		//	property of events itself
		this.listeners = events.listeners;

		return {
			events: events,
			scope: new TestExecutionProcessor({ events: events }),
			create: (function() {
				if (definition && definition.create) {
					$api.deprecate(function() {
						definition.create.call(this);
					}).call(this);
				}
			}).bind(this),
			find: find,
			before: (function(p) {
				if (!p) p = {};
				if (!p.scope) p.scope = {};
				events.fire("scenario", { start: EVENT() });
				var local = copy(p.scope);
				return { scope: local };
			}).bind(this),
			initialize: (function(scope) {
				var initialize = find("initialize");
				if (initialize) {
					try {
						initialize(scope);
					} catch (e) {
						//	TODO	not handling destroy here
						events.fire("test", {
							success: false,
							message: "Uncaught exception in initializer: " + e,
							error: e
						});
						return true;
					}
				}
			}).bind(this),
			after: (function(success,scope) {
				events.fire("scenario", { end: EVENT(), success: success });
				//	TODO	if initialize error, should we try to destroy? Some portion of initialize may have executed ...
				destroy(scope);
				return success;
			}).bind(this)
		};
	}

	var Scenario = function(o,context) {
		var part = Part.apply(this,arguments);

		this.fire = function() {
			part.events.fire.apply(part.events,arguments);
		}

		var createVerify = function(vscope,promises) {
			var verify = new Verify(vscope);
			verify.test = $api.deprecate(function() {
				return vscope.test.apply(this,arguments);
			});
			verify.suite = $api.deprecate(function(o) {
				var suite = new $exports.Suite(o);
				var fire = (function(e) {
					this.scope.fire(e.type,e.detail);
				}).bind(this);
				suite.listeners.add("scenario",fire);
				suite.listeners.add("test",fire);
				suite.run();
			});
			verify.scenario = function(o) {
				var suite = new $exports.Suite({
					parts: {
						scenario: o
					}
				});
				var fire = (function(e) {
					this.scope.fire(e.type,e.detail);
				}).bind(this);
				suite.listeners.add("scenario",fire);
				suite.listeners.add("test",fire);
				if (!promises) {
					suite.run();
				} else {
					if (o.promise) {
						promises.push(suite.promise());
					} else {
						suite.run();
					}
				}
			};
			verify.fire = $api.deprecate(function(type,detail) {
				vscope.fire(type,detail);
			});
			verify.scope = vscope;
			return verify;
		}


		this.run = function(p,next) {
			var local = part.before(p).scope;

			//	TODO	compare below initialize with one used in part
			var vscope = part.scope;

			if (next) {
				if (part.find("next")) {
					part.find("next")(function() {
						var result = part.after(vscope.success,local);
						next(result);
					})
				}
				this.listeners.add("scenario", function(e) {
					console.log("self scenario event", e);
				})
			}
			var error = part.initialize(local);

			if (error) {
				vscope.fail();
			} else {
				var checkForScopeFailure = function(e) {
					vscope.checkForFailure(e);
				};
				this.listeners.add("scenario", checkForScopeFailure);
				this.listeners.add("test", checkForScopeFailure);

				var verify = createVerify(vscope);

				try {
					//	TODO	execute is apparently mandatory
					var execute = part.find("execute");
					var promise = part.find("promise");
					if (!execute) throw new Error("execute not found in " + o);
					if (!promise || !next) {
						execute.call(this,local,verify);
					}
				} catch (e) {
					vscope.error(e);
				}
			}

			var c = context;
			if (!next) {
				return part.after(vscope.success,local);
			} else if (!part.find("next")) {
				next(part.after(vscope.success,local));
			} else {
				if (promise) {
					promise.call(this,local,verify).then(function(result) {
						next(result);
					});
				} else {
					part.find("next")(next);
				}
			}
		}

		this.promise = function scenarioPromise(p) {
			var Promise = $context.api.Promise();
			var local = part.before(p).scope;

			//	TODO	compare below initialize with one used in part
			var vscope = part.scope;

			var error = part.initialize(local);

			if (error) {
				vscope.fail();
				return Promise.resolve(false);
			} else {
				var checkForScopeFailure = function(e) {
					vscope.checkForFailure(e);
				};
				this.listeners.add("scenario", checkForScopeFailure);
				this.listeners.add("test", checkForScopeFailure);

				var promises = [];
				var verify = createVerify(vscope,promises);

				var execute = part.find("execute");
				var promise = part.find("promise");

				var self = this;
				var rv = new Promise(function(resolve,reject) {
					if (execute && !promise) {
						execute.call(self,local,verify);
					} else if (promise) {
						promises.unshift(promise.call(self,local,verify));
					} else {
						throw new Error();
					}
					Promise.all(promises).then(function() {
						part.after(vscope.success,local);
						resolve(vscope.success);
					});
				});

				return rv;
			}
		}

		part.create();
	}

	var Suite = function Suite(c,context) {
		var part = Part.apply(this,arguments);

		var events = part.events;

		var parts = {};

		var addPart = function(id,definition) {
			var type = (definition && definition.parts) ? Suite : Scenario;
			parts[id] = new type(definition,{ id: id, events: events });
		}

		if (c && c.parts) {
			for (var x in c.parts) {
				addPart(x,c.parts[x]);
			}
		}

		var getParts = function() {
			var rv = {};
			for (var x in parts) {
				rv[x] = parts[x];
			}
			return rv;
		}

		defineProperty(this, "parts", {
			get: getParts
		});

		this.getParts = $api.deprecate(getParts);

		this.part = function(id,definition) {
			addPart(id,definition);
		};

		this.run = function(p,next) {
			var scope = part.before(p).scope;
			var path = (p && p.path) ? p.path : [];
			var success = true;
			var error = part.initialize(scope);
			if (error) {
				success = false;
			} else {
				if (path.length == 0) {
					if (next) {
						var keys = [];
						for (var x in parts) {
							keys.push(x);
						}
						if ($context.api && $context.api.Promise) {
							var createPartPromise = function(x) {
								return function() {
									return new $context.api.Promise(function(resolve,reject) {
										var subscope = copy(scope);
										resolve(parts[x].run({
											scope: subscope,
											path: []
										}));
									});
								};
							};
							var promise = $context.api.Promise.resolve();
							for (var i=0; i<keys.length; i++) {
								promise = promise.then(createPartPromise(keys[i])).then(function(result) {
									if (!result) success = false;
									return $context.api.Promise.resolve();
								});
							}
							promise.then(function() {
								log("Done with suite", this);
								next(success);
							});
						} else {
							var index = 0;
							var proceed = function recurse(result) {
								if (result === false) success = false;
								if (index == keys.length) {
									part.after(success,scope);
									next(success);
								} else {
									var x = keys[index++];
									var subscope = copy(scope);
									parts[x].run({
										scope: subscope,
										path: []
									},recurse);
								}
							};
							proceed();
						}
					} else {
						for (var x in parts) {
							var result = parts[x].run({
								scope: copy(scope),
								path: []
							});
							if (!result) {
								success = false;
							}
						}
					}
				} else {
					var child = parts[path[0]];
					if (!child) {
						throw new Error("No child named " + path[0] + " when trying to find [" + path.join("/") + "]; parts are " + Object.keys(parts));
					}
					var result = child.run({
						scope: copy(scope),
						path: path.slice(1)
					},next);
					if (!result) {
						success = false;
					}
				}
			}
			if (!next) return part.after(success,scope);
		}

		if ($context.api && $context.api.Promise) {
			this.promise = function suitePromise(p) {
				var Promise = $context.api.Promise();
				//	TODO	allow p.path, for compatibility and to allow partial suites to be run
				return new Promise(function(resolve,reject) {
					var scope = part.before(p).scope;

					var success = true;
					var promise = Promise.resolve();

					var error = part.initialize(scope);
					if (error) {
						success = false;
					} else {
						var partPromiseFactory = function(x) {
							return function() {
								return parts[x].promise({
									scope: copy(scope),
									path: []
								});
							}
						};

						for (var x in parts) {
							promise = promise.then(partPromiseFactory(x)).then(function(result) {
								if (!result) success = false;
							})
						}
					}

					promise.then(function() {
						part.after(success,scope);
						resolve(success);
					});
				});
			}
		}

		this.scenario = $api.deprecate(function(id,p) {
			addPart(id,p);
		});

		this.suite = $api.deprecate(function(id,p) {
			addPart(id,p);
		});

		part.create();
	};

	$exports.Scenario = Scenario;
	$exports.Suite = Suite;
})();

$exports.getStructure = function getStructure(part) {
	var rv = {
		id: part.id,
		name: part.name
	};
	if (part.parts) {
		var parts = part.parts;
		rv.parts = {};
		for (var x in parts) {
			rv.parts[x] = getStructure(parts[x]);
		}
	}
	return rv;
};

$exports.View = function(o) {
	var On = function(implementation) {
		this.scenario = function(e) {
			if (e.detail.start) {
				if (implementation.start) {
					implementation.start(e.detail.start);
				}
			} else if (e.detail.end) {
				if (implementation.end) {
					implementation.end(e.detail.end, e.detail.success);
				}
			}
		};

		this.test = function(e) {
			if (implementation.test) implementation.test(e.detail);
		}
	};

	var addConsoleListener = function(scenario,implementation) {
		if (typeof(implementation) == "function") {
			scenario.listeners.add("scenario", implementation);
			scenario.listeners.add("test", implementation);
		} else if (implementation && typeof(implementation) == "object") {
			var on = new On(implementation);
			scenario.listeners.add("scenario", on.scenario);
			scenario.listeners.add("test", on.test);
		}
	};

	this.listen = function(scenario) {
		addConsoleListener(scenario,o);
	};

	if (typeof(o) == "object") {
		this.on = new On(o);
	} else if (typeof(o) == "function") {
		this.on = {
			scenario: o,
			test: o
		};
	}
};

$exports.JSON = new function() {
	this.Encoder = function(o) {
		return new $exports.View(new function() {
			this.start = function(scenario) {
				o.send(JSON.stringify({ type: "scenario", detail: { start: { name: scenario.name } } }));
			};

			var jsonError = function(error) {
				if (error) {
					return {
						type: error.type,
						message: error.message,
						stack: error.stack
					}
				} else {
					return void(0);
				}
			}

			this.test = function(result) {
				o.send(JSON.stringify({
					type: "test",
					detail: {
						success: result.success,
						message: result.message,
						error: jsonError(result.error)
					}
				}));
			}

			this.end = function(scenario,success) {
				o.send(
					JSON.stringify({
						type: "scenario",
						detail: { end: { name: scenario.name }, success: success }
					})
				);
			}
		});
	};

	this.Decoder = function() {
		var events = $api.Events({ source: this });

		this.decode = function(string) {
			var json = JSON.parse(string);
			events.fire(json.type, json.detail);
		}
	}
};