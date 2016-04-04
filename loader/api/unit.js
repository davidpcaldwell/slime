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

//	We have an object called Object in this file, so this
var defineProperty = Object.defineProperty;

var Verify = function(scope,vars) {
	var Value = function(v,name) {
		var prefix = (name) ? (name + " ") : "";

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
					this.message = (this.success)
						? "is type " + value
						: "is type " + type + ", not " + value
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

	var Object = function(o,name) {
		Value.call(this,o,name);
		var prefix = function(x) {
			var isNumber = function(x) {
				return !isNaN(Number(x));
			};

			var access = (isNumber(x)) ? "[" + x + "]" : "." + x;
			return (name) ? (name + access) : access;
		}

		var wrap = function(x) {
			return function() {
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
			}
		};

		var wrapProperty = function(x) {
			defineProperty(this, x, {
				get: function() {
					return rv(o[x],prefix(x));
				}
			});
		};

		$api.debug.disableBreakOnExceptionsFor(function(o) {
			for (var x in o) {
				try {
					var noSelection = (o.tagName == "INPUT" && (o.type == "button" || o.type == "checkbox"));
					if (noSelection && x == "selectionDirection") continue;
					if (noSelection && x == "selectionEnd") continue;
					if (noSelection && x == "selectionStart") continue;
					var value = o[x];
					if (typeof(value) == "function") {
						this[x] = wrap(x);
					} else {
						if (x != "is" && x != "evaluate") {
							wrapProperty.call(this,x);
						}
					}
				} catch (e) {
				}
			}
		}).call(this,o);

		if (o instanceof Array) {
			wrapProperty.call(this,"length");
		}
		if (o instanceof Date) {
			this.getTime = wrap("getTime");
		}
		if (o instanceof Error && !this.message) {
			wrapProperty.call(this,"message");
		}

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
							return prefix + "threw " + e;
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
							return name + " did not throw; returned " + returned;
						}
					})
				}
			};

			try {
				var mapped = f.call(o);
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

var ErrorTest = function(e) {
	return function() {
		return {
			success: null,
			message: "Exception thrown: " + e,
			error: e
		};
	}
};

var adaptAssertion = new function() {
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
}

var Scope = function(o) {
	var success = true;
	defineProperty(this,"success",{
		get: function() {
			return success;
		}
	});
	var fail = function() {
		debugger;
		success = false;
	};

	//	IE8-compatible implementation below
	//		var self = this;
	//		this.success = true;
	//		var fail = function() {
	//			debugger;
	//			self.success = false;
	//		}

	this.error = function(e) {
		o.events.fire("test", {
			success: false,
			message: "Uncaught exception: " + e,
			error: e
		});
		fail();
	}


	var units = [];

	//	TODO	can this function be removed?
	var runScenario = function(object,next) {
		//	TODO	definite code smell here as we try to hold together the scenario public "wrapper" with the scenario
		//			implementation; should improve this
		var child = (function() {
			var argument = {};
			for (var x in object) {
				argument[x] = object[x];
			}
			argument.events = o.events;
			return new o.Scenario(argument);
		})(object);
//		var child = (object instanceof o.Scenario) ? object : new o.Scenario(object);

		var runNext = function(next) {
			if ($context.asynchronous && $context.asynchronous.scenario) {
				$context.asynchronous.scenario(next);
			} else {
				next();
			}
		}

		if (o.callback) {
			child.run({
				callback: { success: function(b) {
					if (!b) {
						fail();
					}
					if (next) runNext(next);
				}},
				haltOnException: o.haltOnException
			});
		} else {
			var result = child.run({
				haltOnException: o.haltOnException
			});
			if (!result) {
				fail();
			}
			if (next) runNext(next);
		}
	}

	this.scenario = function(object) {
		if (!o.callback) {
			runScenario(object);
		} else {
			units.push({ scenario: object });
		}
	}

	var runTest = function(assertion,next) {
		assertion = adaptAssertion.assertion(assertion);
		var result = assertion();
		result = adaptAssertion.result(result);
		if (!result.success) {
			fail();
		}
		o.events.fire("test",result);
		if (next) {
			if ($context.asynchronous && $context.asynchronous.test) {
				$context.asynchronous.test(next);
			} else {
				next();
			}
		}
	}

	this.test = function(assertion) {
		if (!o.callback) {
			runTest(assertion);
		} else {
			units.push({ test: assertion });
		}
	};

	this.verify = new Verify(this);

	this.start = function() {
		o.events.fire("scenario", { start: o.scenario });
	}

	this.end = function() {
		if (o.callback) {
			var runUnit = function(units,index) {
				var recurse = arguments.callee;
				if (index == units.length) {
					o.events.fire("scenario", { end: o.scenario, success: this.success });
					o.callback.success(this.success);
				} else {
					var next = function() {
						recurse(units,index+1)
					};
					if (typeof(units[index].scenario) != "undefined") {
						runScenario(units[index].scenario,next);
					} else if (typeof(units[index].test) != "undefined") {
						runTest(units[index].test,next);
					} else {
						throw new Error("Unreachable");
					}
				}
			}

			runUnit.call(this,units,0);
		} else {
			o.events.fire("scenario", { end: o.scenario, success: this.success });
		}
	}

	this.fire = function(type,detail) {
		o.events.fire(type,detail);
		if (typeof(detail.success) != "undefined") {
			if (detail.success === false) {
				success = false;
			}
		}
	}
};
$exports.Scope = Scope;

$exports.Scenario = {};

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
			if (this[property]) {
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

		return {
			events: events,
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

		this.run = function(p,next) {
			var local = part.before(p).scope;

			//	TODO	compare below initialize with one used in part
			var vscope = new Scope({ events: part.events });

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
				var verify = new Verify(vscope);
				verify.test = $api.deprecate(function() {
					return vscope.test.apply(this,arguments);
				});
				verify.suite = $api.deprecate(function(o) {
					var suite = new $exports.Suite(o);
					var fire = (function(e) {
						this.fire(e.type,e.detail);
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
						this.fire(e.type,e.detail);
					}).bind(this);
					suite.listeners.add("scenario",fire);
					suite.listeners.add("test",fire);
					suite.run();
				}
				verify.fire = $api.deprecate(function(type,detail) {
					vscope.fire(type,detail);
				});
				verify.scope = vscope;
				try {
					//	TODO	execute is apparently mandatory
					var execute = part.find("execute");
					if (!execute) throw new Error("execute not found in " + o);
					execute.call(this,local,verify);
				} catch (e) {
					vscope.error(e);
				}
			}

			if (!next) {
				return part.after(vscope.success,local);
			} else {
//				next(part.after(vscope.success,local));
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
						var index = 0;
						var proceed = function recurse(success) {
							if (index == keys.length) {
								next(success);
							} else {
								var x = keys[index++];
								parts[x].run({
									scope: copy(scope),
									path: []
								},recurse);
							}
						};
						proceed();
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
					var result = child.run({
						scope: copy(scope),
						path: path.slice(1)
					},next);
					if (!result) {
						success = false;
					}
				}
			}
			return part.after(success,scope);
		}

		this.scenario = $api.deprecate(function(id,p) {
			addPart(id,p);
//			addPart(id,Scenario,p,{ id: id, events: events });
		});

		this.suite = $api.deprecate(function(id,p) {
			addPart(id,p);
//			addPart(id,Suite,p,{ id: id, events: events });
		});

		part.create();
	};

	$exports.Suite = Suite;
})();


$exports.View = function(o) {
	var addConsoleListener = function(scenario,implementation) {
		if (typeof(implementation) == "function") {
			scenario.listeners.add("scenario", implementation);
			scenario.listeners.add("test", implementation);
		} else if (implementation && typeof(implementation) == "object") {
			scenario.listeners.add("scenario", function(e) {
				if (e.detail.start) {
					if (implementation.start) {
						implementation.start(e.detail.start);
					}
				} else if (e.detail.end) {
					if (implementation.end) {
						implementation.end(e.detail.end, e.detail.success);
					}
				}
			});

			scenario.listeners.add("test", function(e) {
				if (implementation.test) implementation.test(e.detail);
			});
		}
	};

	this.listen = function(scenario) {
		addConsoleListener(scenario,o);
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