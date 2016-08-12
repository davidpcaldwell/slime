//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return Boolean(jsh.js) && jsh.hasOwnProperty("java");
	},
	load: function() {
		Object.defineProperty(
			jsh,
			"debug",
			{
				get: $api.Function.singleton(function() {
					var rv = $loader.module("module.js", $loader.file("context.java.js"));
					
					var Dumper = function(indent,p) {
						var top;

						var getTitle = function(data) {
							var title = (function() {
								if (typeof(data.node) == "undefined") {
									return (top) ? top : "(top)";
								} else if (data.node == null) {
									return "(self)";
								} else if (typeof(data.node == "function")) {
									if (data.label) {
										return data.label;
									}
									var code = String(data.node);
									code = code.split("\n").map(function(line) {
										return indent + line;
									}).slice(0,-1).join("\n")
									return code;
								} else {
									throw new Error("Unknown node type: " + data.node);
								}
							})();
							return title;
						}

						this.start = function(id) {
							top = id;
						}

						this.child = function() {
							return new Dumper(indent + p.indent, p);
						}

						this.dump = function(data) {
							if (data.calls > 0) {
								debugger;
								var title = getTitle(data);
								var counts = [
									"Elapsed: " + String( (data.elapsed / 1000).toFixed(3) )
									,"calls: " + data.calls
									,"average: " + String( (data.elapsed / data.calls / 1000).toFixed(6) )
								].join(" ");
								if (title.indexOf("\n") == -1) {
									p.log(indent + title + " " + counts);
								} else {
									p.log(indent + counts + " " + title);
								}
							} else {
								p.log(indent + getTitle(data));
							}
						}
					}

					rv.profile.cpu.dump = (function(f) {
						return function(p) {
							if (p.indent && p.log) {
								//	TODO	use $api.deprecate? Would it work in a plugin?
								debugger;
								return f.call(this, new Dumper("", p));
							} else {
								return f.call(this, p);
							}
						}
					})(rv.profile.cpu.dump);
					
					rv.disableBreakOnExceptionsFor = $api.deprecate($api.debug.disableBreakOnExceptionsFor);

					return rv;
				})
			}
		)

		jsh.java.log = $loader.file("logging.java.js", {
			prefix: "inonit.script.jsh.Shell.log",
			api: {
				java: jsh.java
			}
		}).log;


		if ($jsh.getDebugger) {
			$api.debugger = {};
			Object.defineProperty($api.debugger, "breakOnExceptions", {
				get: function() {
					return $jsh.getDebugger().isBreakOnExceptions();
				},
				set: function(v) {
					$jsh.getDebugger().setBreakOnExceptions(v);
				}
			});
		}

		jsh.js.Error.Type = $api.debug.disableBreakOnExceptionsFor(jsh.js.Error.Type);
	}
})