//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.jrunscript.JavaAdapter } JavaAdapter
	 * @param { { api: { java: slime.jrunscript.java.Exports, unit: slime.jsh.unit.Exports } } } $context
	 * @param { any } $exports
	 */
	function(Packages,JavaAdapter,$context,$exports) {
		$exports.Console = function(o) {
			var console = new function() {
				this.println = function(s) {
					if (typeof(s) == "undefined") s = "";
					if (o.println) {
						o.println(s);
					} else {
						o.writer.write( s + "\n");
					}
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
						//	TODO	When running loader/api/old/jsh tests on FreeBSD this property is a string, is it ever an array? Harmonize
						console.println(e.stack);
					}
				}
				if (e.javaException) {
					var current = e.javaException;
					while(current) {
						var _stack = current.getStackTrace();
						if (current == e.javaException) {
							console.println("Java stack trace for: " + String(current.getClass().getName()));
							if (String(current.getClass().getName()) == "inonit.script.rhino.Engine$Errors") {
								current.dump(new JavaAdapter(
									Packages.inonit.script.rhino.Engine.Log,
									new function() {
										this.println = function(s) {
											console.println(s);
										}
									}
								), "[dpc] ");
							}
						} else {
							console.println("Caused by:");
						}
						console.println(current);
						for (var i=0; i<_stack.length; i++) {
							console.println("\t" + _stack[i]);
						}
						current = current.getCause();
					}
				}
				if (e.code) {
					console.println("Executing code: " + e.code);
				}
				if (e.cause) {
					if (e.cause == e) {
						throw new Error("Bug in setting cause");
					}
					if ($context.api.java.isJavaObject(e.cause)) {
						printError({ javaException: e.cause });
					} else {
						console.println("Caused by:");
						printError(e.cause);
					}
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
				for (var x in e) {
					if (typeof(e[x]) != "function") {
						if (x != "code" && x != "cause" && x != "javaException" && x != "stack" && x != "message" && x != "name") {
							console.println("" + x + " = [" + e[x] + "]");
						}
					}
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
				console.print(indent());
				console.println(test.message);
				if (!success) {
					// if (!dots) {
					// 	$context.console.print(indent());
					// 	dots = true;
					// }
					// var code = (success == null) ? "*" : "X";
					// $context.console.print(code);
					// $context.console.println(test.message(success));
					if (test.error) {
						printError(test.error);
					} else if (success == null) {
						console.println("success = " + success + " and no error property provided for test.");
						console.println(new Error().stack);
					}
					stack[stack.length-1].success = false;
				} else {
					// if (!dots) {
					// 	$context.console.print(indent());
					// 	dots = true;
					// }
					// $context.console.println(test.message(success));
					// $context.console.print(".");
				}
			}

			this.end = function(scenario) {
				if (dots) {
					console.println();
					dots = false;
				}
				var item = stack.pop();
				//	Adding JSON.stringify comparison to deal with scenarios that come from remote events
				if (item.scenario != scenario && JSON.stringify(item.scenario) != JSON.stringify(scenario)) {
					throw new Error("Scenario stack is corrupted: expected " + JSON.stringify(scenario) + "\ngot " + JSON.stringify(item.scenario));
				}
				var prefix = (item.success) ? "PASSED:  " : "FAILED:  ";
				log(prefix + scenario.name);
				if (!item.success) {
					if (stack.length > 0) {
						stack[stack.length-1].success = false;
					} else {
						// throw "Unimplemented";
						// success = false;
					}
				}
			}
		};

		$exports.Events = function(p) {
			return new $context.api.unit.JSON.Encoder({
				send: function(s) {
					p.writer.write(s + String(Packages.java.lang.System.getProperty("line.separator")));
				}
			});
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,$context,$exports);
