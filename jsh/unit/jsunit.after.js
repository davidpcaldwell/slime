//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
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

	this.test = function(test) {
		if (!test.success) {
			if (!dots) {
				$context.console.print(indent());
				dots = true;
			}
			var code = (test.success == null) ? "*" : "X";
			$context.console.print(code);
			if (test.success == null) {
				$context.console.println(test.error);
				if (test.error.stack) {
					if (test.error.stack.join) {
						$context.console.println(test.error.stack.join("\n"));
					} else {
						//	TODO	When running jsh/unit tests on FreeBSD this property is a string, is it ever an array? Harmonize
						$context.console.println(test.error.stack);
					}
				}
			}
			stack[stack.length-1].success = false;
		} else {
			if (!dots) {
				$context.console.print(indent());
				dots = true;
			}
			$context.console.print(".");
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