//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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
		Packages.java.lang.System.out.println(indent() + message);
	}

	var dots = false;

	this.start = function(scenario) {
		if (dots) {
			Packages.java.lang.System.out.println();
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
				Packages.java.lang.System.out.print(indent());
				dots = true;
			}
			var code = (test.success == null) ? "*" : "X";
			Packages.java.lang.System.out.print(code);
			Packages.java.lang.System.out.flush();
			if (test.success == null && $context.verbose) {
				Packages.java.lang.System.out.println("Error = " + test.messages.failure);
			}
			stack[stack.length-1].success = false;
		} else {
			if (!dots) {
				Packages.java.lang.System.out.print(indent());
				dots = true;
			}
			Packages.java.lang.System.out.print(".");
			Packages.java.lang.System.out.flush();
		}
	}

	this.end = function(scenario) {
		if (dots) {
			Packages.java.lang.System.out.println();
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
