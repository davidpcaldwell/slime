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

$exports.Scenario = function(properties) {
	if (!properties) {
		throw new TypeError("'properties' argument must be present.");
	}
	var Scenario = arguments.callee;
	var scenario = this;

	this.name = properties.name;

	var Scope = function(console,callback) {
		var self = this;
		if (Object.prototype.__defineGetter__) {
			var success = true;
			this.__defineGetter__("success", function() {
				return success;
			});
			var fail = function() {
				debugger;
				success = false;
			}
		} else {
			this.success = true;
			var fail = function() {
				debugger;
				self.success = false;
			}
		}

		var units = [];

		var runScenario = function(object,next) {
			var child = new Scenario(object);

			var runNext = function(next) {
				if ($context.asynchronous && $context.asynchronous.scenario) {
					$context.asynchronous.scenario(next);
				} else {
					next();
				}
			}

			if (callback) {
				child.start(console,{
					success: function(b) {
						if (!b) {
							fail();
						}
						if (next) runNext(next);
					}
				})
			} else {
				var result = child.run(console);
				if (!result) {
					fail();
				}
				if (next) runNext(next);
			}
		}

		this.scenario = function(object) {
			if (!callback) {
				runScenario(object);
			} else {
				units.push({ scenario: object });
			}
		}

		var runTest = function(assertion,next) {
			var MESSAGE = function(success) {
				return (success) ? "Success." : "FAILED!";
			};

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
			if (typeof(assertion) == "boolean") {
				assertion = (function(b) {
					return (function() {
						if (callback) {
							//	warning: test probably did not work as expected asynchronously
							//	debugger;
						}
						return {
							success: function() { return b; },
							message: MESSAGE
						};
					})();
				})(assertion);
			} else if (typeof(assertion) == "undefined") {
				throw "Assertion is undefined.";
			} else if (assertion === null) {
				assertion = function() {
					return {
						success: function() { return null; },
						message: MESSAGE
					}
				};
			} else if (
					(typeof(assertion) == "object" && assertion != null && typeof(assertion.success) == "boolean")
					|| (typeof(assertion) == "object" && assertion != null && assertion.success === null)
				) {
				assertion = (function(object) {
					return new function() {
						this.success = function() {
							return object.success;
						};

						if (object.messages) {
							this.message = MESSAGE_FOR_MESSAGES(object.messages);
						} else {
							this.message = MESSAGE;
						}
					}
				})(assertion);
			} else if (typeof(assertion) == "function") {
				assertion = (function(f) {
					var v = f();
					if (typeof(v) == "boolean") {
						v = (function(value) {
							return new function() {
								this.success = function() {
									return value;
								};

								this.message = MESSAGE;
							}
						})(v);
					};
					return new function() {
						this.success = function() {
							return v.success;
						};

						this.message = MESSAGE_FOR_MESSAGES;
					}
				})(assertion);
			} else if (typeof(assertion) != "object" || typeof(assertion.success) != "function") {
				var error = new TypeError("Assertion is not valid format; see this error's 'assertion' property for incorrect value");
				error.assertion = assertion;
				throw error;
			}
			var success = assertion.success();
			if (!success) {
				fail();
			}
			var result = {
				success: success,
				message: function() {
					//	TODO	this may be an expensive operation, which is why it is a function in the first place; should cache
					//			the value in case callers invoke it multiple times
					try {
						return assertion.message(success);
					} catch (e) {
						return "Error occurred when trying to generate message: " + e;
					}
				}
			};
			if (console.test) console.test(result);
			if (next) {
				if ($context.asynchronous && $context.asynchronous.test) {
					$context.asynchronous.test(next);
				} else {
					next();
				}
			}
		}

		this.test = function(assertion) {
			if (!callback) {
				runTest(assertion);
			} else {
				units.push({ test: assertion });
			}
		}

		this.start = function(console) {
			if (console.start) console.start(scenario);
		}

		this.end = function(console) {
			if (callback) {
				var self = this;
				var runUnit = function(units,index) {
					var recurse = arguments.callee;
					if (index == units.length) {
						if (console.end) console.end(scenario,self.success);
						callback.success(self.success);
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

				runUnit(units,0);
			} else {
				if (console.end) console.end(scenario, this.success);
			}
		}
	}

	var run = function(console,callback) {
		var scope = new Scope(console,callback);

		//	Could we use this to make syntax even terser?
		//	After a bunch of trying, I was able to get scope.test to be available
		//	to the callee as __parent__.test but not as test
		//	this.__parent__ = scope;
		//	this.test = scope.test;
		scope.start(console);

		var initializeAndExecute = function(scope) {
			if (properties.initialize) properties.initialize.call(this);
			properties.execute.call(this,scope);
		}

		if (Scenario.HALT_ON_EXCEPTION) {
			initializeAndExecute.call(this,scope);
		} else {
			try {
				initializeAndExecute.call(this,scope);
			} catch (e) {
				//	The next line works around a bug in the Rhino debugger (as of 1.7R2) that does not put 'e' in the local scope
				//	so that it cannot be examined. Assigning it to the variable error allows the 'error' variable to be evaluated
				//	and viewed in the debugger when running in Rhino.
				var error = e;
				scope.test({
					success: function() {
						return null;
					},
					error: e,
					messages: {
						failure: function() {
							return "Exception thrown: " + e;
						}
					}
				});
			}
		}
		if (properties.destroy) {
			properties.destroy.call(this);
		}
		scope.end(console);
		if (!callback) {
			return scope.success;
		}
	}

	this.start = function(console,callback) {
		run(console,callback);
	}

	this.run = function(console) {
		return run(console);
	}

	this.toString = function() {
		return "Scenario: " + this.name;
	}
}
$exports.Scenario.HALT_ON_EXCEPTION = false;