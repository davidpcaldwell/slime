//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME loader infrastructure.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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
			if (callback) {
				child.start(console,{
					success: function(b) {
						if (!b) {
							fail();
						}
						if (next) next();
					}
				})
			} else {
				var result = child.run(console);
				if (!result) {
					fail();
				}
				if (next) {
					if ($context.asynchronous && $context.asynchronous.scenario) {
						$context.asynchronous.scenario(next);
					} else {
						next();
					}
				}
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
			if (typeof(assertion) == "boolean") {
				assertion = (function(b) {
					return function() {
						if (callback) {
							//	warning: test probably did not work as expected asynchronously
							//	debugger;
						}
						return { 
							success: b,
							messages: {
								success: "Success.",
								failure: "FAILED!"
							}
						};
					}
				})(assertion);
			} else if (typeof(assertion) == "undefined") {
				throw "Assertion is undefined.";
			}
			var result = assertion();
			if (!result.messages) result.messages = {};
			if (!result.messages.success) {
				result.messages.success = "Success.";
			}
			if (!result.messages.failure) {
				result.messages.failure = "FAILED!";
			}
			if (!result.success) {
				fail();
			}
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
						if (units[index].scenario) {
							runScenario(units[index].scenario,next);
						} else if (units[index].test) {
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
				scope.test({
					success: null,
					error: e,
					messages: new function() {
						this.failure = "Exception thrown: " + e;
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
