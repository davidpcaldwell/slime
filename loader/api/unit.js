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
		if (o instanceof Array) {
			wrapProperty.call(this,"length");
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
//		var $document = rv(inonit.slim.getDocument(),"inonit.slim.getDocument()");
//		for (var x in $document) {
//			rv[x] = $document[x];
//		}
//		rv.getComponent = (function() {
//			return function(path,decorator) {
//				var component = inonit.slim.getDocument().getComponent(path);
//				if (decorator) decorator.call(component);
//				return rv(component,"getComponent(\"" + path + "\")");
//			}
//		})();
//		rv.map = function(object,f) {
//			return object.evaluate(f);
//		};
	//	TODO	remove Slim cross-dependency, if it is in fact used
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

	var units = [];

	var runScenario = function(object,next) {
		//	TODO	definite code smell here as we try to hold together the scenario public "wrapper" with the scenario
		//			implementation; should improve this
		var child = (function() {
			if (object instanceof o.Scenario) return object;
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
				console: o.console,
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
				console: o.console,
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
		if (o.console.test) o.console.test(result);
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
		if (o.console.start) o.console.start(o.scenario);
	}

	this.end = function() {
		if (o.callback) {
			var runUnit = function(units,index) {
				var recurse = arguments.callee;
				if (index == units.length) {
					o.events.fire("scenario", { end: o.scenario });
					if (o.console.end) o.console.end(o.scenario,this.success);
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
			o.events.fire("scenario", { end: o.scenario });
			if (o.console.end) o.console.end(o.scenario, this.success);
		}
	}
}

var Scenario = function(o) {
	if (!o) {
		throw new TypeError("arguments[0] must be present.");
	}

	var events = $api.Events({ source: this, parent: (o.events) ? o.events : null });

	this.name = o.name;

	if (o.composite && o.execute) {
		throw new Error();
	}
	if (o.composite) {
		(function() {
			var parts = [];

			this.add = function(part) {
				parts.push(part);
			};

			o.execute = function(scope) {
				parts.forEach(function(part) {
					if (part.scenario) {
						scope.scenario(part.scenario);
					} else {
						throw new Error("Part is not scenario");
					}
				});
			};
		}).call(this);
	}

	var run = function(p) {
		var scope = new Scope({ scenario: p.scenario, console: p.console, callback: p.callback, Scenario: p.Scenario, events: events});

		//	Could we use this to make syntax even terser?
		//	After a bunch of trying, I was able to get scope.test to be available
		//	to the callee as __parent__.test but not as test
		//	this.__parent__ = scope;
		//	this.test = scope.test;
		scope.start(p.console);

		var initializeAndExecute = function(scope) {
			if (o.initialize) o.initialize();
			if (o.verify) {
				var verify = new Verify(scope);
				o.execute(verify);
			} else {
				o.execute(scope);
			}
		}

		if (p.haltOnException) {
			initializeAndExecute(scope);
		} else {
			try {
				initializeAndExecute(scope);
			} catch (e) {
				scope.test(ErrorTest(e));
			}
		}
		if (o.destroy) {
			o.destroy();
		}
		scope.end(p.console);
		if (!p.callback) {
			return scope.success;
		}
	}

	this.run = function(o) {
		if (arguments.length == 1 && arguments[0].console) {
			return run({ scenario: this, console: arguments[0].console, callback: arguments[0].callback, Scenario: Scenario, haltOnException: arguments[0].haltOnException });
		} else {
			throw new Error();
//			return $api.deprecate(function() {
//				var console = o;
//				return run({ scenario: this, console: arguments[0], Scenario: Scenario, callback: arguments[1] });
//			}).apply(this,arguments);
		}
	}

//	this.start = $api.deprecate(function(console,callback) {
//		run(console,callback);
//	});

	this.toString = function() {
		return "Scenario: " + this.name;
	}
};

$exports.Scenario = Scenario;