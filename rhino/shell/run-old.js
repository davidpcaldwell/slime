//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.internal.run.old.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.internal.run.old.Exports> } $export
	 */
	function($api,$context,$export) {
		var scripts = $context.scripts;
		/**
		 *
		 * @param { slime.jrunscript.shell.run.old.Argument } p
		 * @return { slime.jrunscript.shell.invocation.old.Argument["stdio"] }
		 */
		function extractStdioIncludingDeprecatedForm(p) {
			if (typeof(p.stdio) != "undefined") return p.stdio;

			if (typeof(p.stdin) != "undefined" || typeof(p.stdout) != "undefined" || typeof(p.stderr) != "undefined") {
				return $api.deprecate(function() {
					return {
						input: p.stdin,
						output: p.stdout,
						error: p.stderr
					};
				})();
			}

			return {};
		}

		/**
		 *
		 * @param { Parameters<slime.jrunscript.shell.Exports["run"]>[0] } p
		 * @param { Parameters<slime.jrunscript.shell.Exports["run"]>[1] } events
		 */
		var run = function(p,events) {
			var as;
			if (p.as) {
				as = p.as;
			}

			p.stdio = extractStdioIncludingDeprecatedForm(p);

			var context = scripts.invocation.toContext(p, $context.environment, $context.stdio);

			/** @type { slime.jrunscript.shell.internal.module.Invocation } */
			var invocation = (
				/**
				 *
				 * @returns { slime.jrunscript.shell.internal.module.Invocation }
				 */
				function() {
					/** @type { slime.jrunscript.shell.internal.module.Invocation } */
					var rv = {
						configuration: {
							command: void(0),
							arguments: void(0)
						},
						result: {
							command: void(0),
							arguments: void(0),
							as: void(0)
						}
					};

					/**
					 * @param { slime.jrunscript.shell.invocation.old.Argument["command"] } command
					 * @param { slime.jrunscript.shell.invocation.old.Argument["arguments"] } args
					 * @returns { slime.jrunscript.shell.internal.run.java.Configuration }
					 */
					var toConfiguration = function(command,args) {
						/**
						 *
						 * @param { slime.jrunscript.shell.invocation.Token } v
						 * @returns
						 */
						var toErrorMessageString = function(v) {
							if (typeof(v) == "undefined") return "(undefined)";
							if (v === null) return "(null)";
							return String(v);
						};

						/**
						 *
						 * @param { slime.jrunscript.shell.invocation.old.Argument["command"] } command
						 * @param { slime.jrunscript.shell.invocation.old.Argument["arguments"] } args
						 */
						var toErrorMessage = function(command,args) {
							/** @type { slime.jrunscript.shell.invocation.Token[] } */
							var full = [command];
							if (args) full = full.concat(args);
							return full.map(toErrorMessageString).join(" ");
						};

						try {
							return scripts.invocation.toConfiguration({
								command: command,
								arguments: args
							});
						} catch (e) {
							if (e instanceof scripts.invocation.error.BadCommandToken) {
								throw new TypeError(e.message + "; full invocation = " + toErrorMessage(command, args));
							} else {
								throw e;
							}
						}
					};

					if (p.tokens) {
						return $api.deprecate(function() {
							//	TODO	ensure array
							if (p.tokens.length == 0) {
								throw new TypeError("tokens cannot be zero-length.");
							}
							//	Use a raw copy of the arguments for the callback
							rv.result.command = p.tokens[0];
							rv.result.arguments = p.tokens.slice(1);
							rv.configuration = toConfiguration(p.tokens[0], p.tokens.slice(1));
							return rv;
						})();
					} else if (typeof(p.command) != "undefined") {
						rv.result.command = p.command;
						//	TODO	switch to $api.fp.mutating
						rv.result.arguments = p.arguments;
						rv.result.as = p.as;
						rv.configuration = toConfiguration(p.command, p.arguments);
						return rv;
					} else {
						throw new TypeError("Required: command property or tokens property");
					}
				}
			)();

			if (as) {
				if ($context.os.name() == "Linux") {
					invocation.configuration.command = "sudo";
					invocation.configuration.arguments = ["-u", as.user].concat(invocation.configuration.arguments);
				}
			}

			var directory = (typeof(context.directory) == "string") ? $context.api.file.Pathname(context.directory).directory : context.directory;

			/**
			 * @type { slime.jrunscript.shell.run.old.Argument }
			 */
			var input = {
				command: invocation.result.command,
				arguments: invocation.result.arguments,
				environment: context.environment,
				directory: directory
			};
			input.workingDirectory = directory;
			$api.deprecate(input,"workingDirectory");

			var result = scripts.run.old.run(context, invocation.configuration, $context.module, events, p, input, scripts.invocation.isLineListener);

			var evaluate = (p["evaluate"]) ? p["evaluate"] : $exports.run.evaluate;
			return evaluate($api.Object.compose(input, result));
		};

		/** @type { slime.jrunscript.shell.internal.run.old.Exports } */
		var $exports = {
			run: void(0),
			$run: run
		};

		$exports.run = Object.assign(
			$api.events.Function(run),
			{
				evaluate: void(0),
				stdio: void(0)
			}
		);

		$exports.run.evaluate = function(result) {
			if (result.error) throw result.error;
			if (result.status != 0) throw new Error("Exit code: " + result.status + " executing " + result.command + ((result.arguments && result.arguments.length) ? " " + result.arguments.join(" ") : ""));
			return result;
		};

		$exports.run.stdio = Object.assign(
			(
				/**
				 *
				 * @param { Parameters<slime.jrunscript.shell.Exports["run"]>[0] } p
				 * @return { slime.jrunscript.shell.internal.run.Stdio }
				 */
				function getStdio(p) {
					//	TODO	the getStdio function is currently used in jsh.js, requiring us to export it; is that the best structure?
					var stdio = extractStdioIncludingDeprecatedForm(p);

					if (stdio) {
						//	TODO	the below $api.Events() is highly dubious, inserted just to get past TypeScript; who knows
						//			whether it will work but refactoring in progress may change it further
						var fixed = scripts.invocation.updateForStringInput(stdio);
						scripts.invocation.fallbackToParentStdio(fixed, $context.stdio);
						var x = scripts.invocation.toStdioConfiguration(fixed);
						var rv = scripts.run.old.buildStdio(x)($api.Events());
						return rv;
					}
					if (!stdio) {
						//	TODO	could be null if p.stdio === null. What would that mean? And what does $context.stdio have to do with
						//			it?
						if (!$context.stdio) {
							if (p.stdio === null) {
								//	That's what we thought
							} else {
								//	The only way rv should be anything other than an object is if p.stdio was null
								throw new Error("Unreachable");
							}
						}
						return null;
					}
				}
			),
			{
				LineBuffered: function(o) {
					return Object.assign({}, o, {
						output: {
							line: function(line) {
								o.stdio.output.write(line + $context.os.newline());
							}
						},
						error: {
							line: function(line) {
								o.stdio.error.write(line + $context.os.newline());
							}
						}
					});
				}
			}
		);

		$export($exports);
	}
//@ts-ignore
)($api,$context,$export);
