//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.Console = function(o) {
	var console = new function() {
		this.println = function(s) {
			if (typeof(s) == "undefined") s = "";
			o.writer.write( s + "\n");
		};

		this.print = function(s) {
			o.writer.write(s);
		}
	};

	var stack = [];

	var indent = function() {
		return new Array(stack.length+1).join("  ");
	}

	var log = function(message) {
		console.println(indent() + message);
	}

	var dots = false;

	this.start = function(scenario) {
		if (dots) {
			console.println();
			dots = false;
		}
		log("Running: " + scenario.name);
		stack.push({
			scenario: scenario,
			success: true
		});
	}

	var printError = function(e) {
		console.println(e);
		if (e.message) {
			console.println(e.message);
		}
		if (e.stack) {
			if (e.stack.join) {
				console.println(e.stack.join("\n"));
			} else {
				//	TODO	When running jsh/unit tests on FreeBSD this property is a string, is it ever an array? Harmonize
				console.println(e.stack);
			}
		}
		if (e.cause) {
			console.println("Executing code: " + e.code);
			if (e.cause == e) {
				throw new Error("Bug in setting cause");
			}
			printError(e.cause);
		}
		if (e.getStackTrace) {
			var trace = e.getStackTrace();
			for (var i=0; i<trace.length; i++) {
				console.println("\t" + trace[i]);
			}
		}
		if (e.getCause) {
			if (e.getCause()) printError(e.getCause());
		}
	}

	this.caught = function(p) {
		console.println("Caught something in .caught()");
		if (p.initialize) {
			console.println("typeof(p.initialize) = " + typeof(p.initialize));
			console.println("Caught error in initializer: code = ");
			console.println(String(p.initialize));
		}
		printError(p.error);
	}

	this.test = function(test) {
		var success = test.success;
		var old = false;
		if (old) {
			if (!success) {
				if (!dots) {
					console.print(indent());
					dots = true;
				}
				var code = (success == null) ? "*" : "X";
				console.print(code);
				if (test.error) {
					printError(test.error);
				} else if (success == null) {
					console.println("No error property provided for test.")
				}
				stack[stack.length-1].success = false;
			} else {
				if (!dots) {
					console.print(indent());
					dots = true;
				}
				console.print(".");
			}
		} else {
			console.print(indent());
			console.println(test.message);
			if (!success) {
//				if (!dots) {
//					$context.console.print(indent());
//					dots = true;
//				}
//				var code = (success == null) ? "*" : "X";
//				$context.console.print(code);
//				$context.console.println(test.message(success));
				if (test.error) {
					printError(test.error);
				} else if (success == null) {
					console.println("No error property provided for test.")
				}
				stack[stack.length-1].success = false;
			} else {
//				if (!dots) {
//					$context.console.print(indent());
//					dots = true;
//				}
//				$context.console.println(test.message(success));
//				$context.console.print(".");
			}

		}
	}

	this.end = function(scenario) {
		if (dots) {
			console.println();
			dots = false;
		}
		var item = stack.pop();
		if (item.scenario != scenario) {
			throw new Error("Scenario stack is corrupted.");
		}
		var prefix = (item.success) ? "PASSED:  " : "FAILED:  ";
		log(prefix + scenario.name);
		if (!item.success) {
			if (stack.length > 0) {
				stack[stack.length-1].success = false;
			} else {
//				throw "Unimplemented";
//				success = false;
			}
		}
	}
};

$exports.JSON = new function() {
	this.Encoder = function(o) {
		return new $context.api.unit.View(new function() {
			this.start = function(scenario) {
				o.send(JSON.stringify({ start: { scenario: { name: scenario.name } } }));
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
					test: {
						success: result.success,
						message: result.message,
						error: jsonError(result.error)
					}
				}));
			}

			this.end = function(scenario,success) {
				o.send(JSON.stringify({ end: { scenario: { name: scenario.name }, success: success }}));
			}
		});
	}
};
