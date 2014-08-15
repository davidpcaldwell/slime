//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.console = new function() {
	var stack = [];

	var indent = function() {
		var m = "";
		for (var i=0; i<stack.length; i++) {
			m += "  ";
		}
		return m;
	}

	var log = function(message) {
		$context.console.println(indent() + message);
	}

	var dots = false;

	this.start = function(scenario) {
		if (dots) {
			$context.console.println();
			dots = false;
		}
		log("Running: " + scenario.name);
		stack.push({
			scenario: scenario,
			success: true
		});
	}

	var printError = function(e) {
		$context.console.println(e);
		if (e.message) {
			$context.console.println(e.message);
		}
		if (e.stack) {
			if (e.stack.join) {
				$context.console.println(e.stack.join("\n"));
			} else {
				//	TODO	When running jsh/unit tests on FreeBSD this property is a string, is it ever an array? Harmonize
				$context.console.println(e.stack);
			}
		}
		if (e.cause) {
			$context.console.println("Executing code: " + e.code);
			if (e.cause == e) {
				throw new Error("Bug in setting cause");
			}
			printError(e.cause);
		}
		if (e.getStackTrace) {
			var trace = e.getStackTrace();
			for (var i=0; i<trace.length; i++) {
				$context.console.println("\t" + trace[i]);
			}
		}
		if (e.getCause) {
			if (e.getCause()) printError(e.getCause());
		}
	}

	this.caught = function(p) {
		$context.console.println("Caught something in .caught()");
		if (p.initialize) {
			$context.console.println("typeof(p.initialize) = " + typeof(p.initialize));
			$context.console.println("Caught error in initializer: code = ");
			$context.console.println(String(p.initialize));
		}
		printError(p.error);
	}

	this.test = function(test) {
		var success = test.success;
		var old = false;
		if (old) {
		if (!success) {
			if (!dots) {
				$context.console.print(indent());
				dots = true;
			}
			var code = (success == null) ? "*" : "X";
			$context.console.print(code);
			if (test.error) {
				printError(test.error);
			} else if (success == null) {
				$context.console.println("No error property provided for test.")
			}
			stack[stack.length-1].success = false;
		} else {
			if (!dots) {
				$context.console.print(indent());
				dots = true;
			}
			$context.console.print(".");
		}
		} else {
			$context.console.print(indent());
			if (!success) {
//				if (!dots) {
//					$context.console.print(indent());
//					dots = true;
//				}
//				var code = (success == null) ? "*" : "X";
//				$context.console.print(code);
				$context.console.println(test.message(success));
				if (test.error) {
					printError(test.error);
				} else if (success == null) {
					$context.console.println("No error property provided for test.")
				}
				stack[stack.length-1].success = false;
			} else {
//				if (!dots) {
//					$context.console.print(indent());
//					dots = true;
//				}
				$context.console.println(test.message(success));
//				$context.console.print(".");
			}

		}
	}

	this.end = function(scenario) {
		if (dots) {
			$context.console.println();
			dots = false;
		}
		var item = stack.pop();
		if (item.scenario != scenario) {
			throw "Scenario stack is corrupted.";
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
}