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
		/**
		 *
		 * @param { slime.jrunscript.shell.run.intention.Input } p
		 * @return { slime.jrunscript.runtime.io.InputStream }
		 */
		var toInputStream = (
			function($context) {
				return function(p) {
					if (typeof(p) == "string") {
						var buffer = new $context.library.io.Buffer();
						buffer.writeText().write(p);
						buffer.close();
						return buffer.readBinary();
					} else {
						return p;
					}
				};
			}
		)({ library: { io: $context.api.io }});

		/**
		 * @param { slime.jrunscript.shell.invocation.old.Stdio } p
		 * @return { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed }
		 */
		var updateForStringInput = function(p) {
			/** @type { slime.jrunscript.shell.run.StdioConfiguration } */
			return {
				input: toInputStream(p.input),
				output: p.output,
				error: p.error
			};
		};

		/**
		 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
		 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToLines }
		 */
		var isLineListener = function(configuration) {
			return configuration && Object.prototype.hasOwnProperty.call(configuration, "line");
		};

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed } declaration
		 * @return { slime.jrunscript.shell.run.StdioConfiguration }
		 */
		function toStdioConfiguration(declaration) {
			/**
			 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
			 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToString }
			 */
			var isString = function(configuration) {
				return configuration === String
			};

			//	TODO	unused
			/**
			 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
			 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToStream }
			 */
			var isRaw = function(configuration) {
				return true;
			}

			/** @type { (configuration: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => slime.jrunscript.shell.run.OutputCapture } */
			var toCapture = function(configuration) {
				if (isLineListener(configuration)) {
					return "line";
				} else if (isString(configuration)) {
					return "string";
				} else {
					return configuration;
				}
			}

			return {
				input: declaration.input,
				output: toCapture(declaration.output),
				error: toCapture(declaration.error)
			};
		}

		/** @type { slime.jrunscript.shell.internal.invocation.Export } */
		var invocation = (
			function($api,$context) {
				var parseCommandToken = (
					function() {
						var ArgumentError = $api.Error.old.Type({ name: "ArgumentError", extends: TypeError });

						/**
						 *
						 * @param { slime.jrunscript.shell.invocation.old.Token } arg
						 * @param { number } [index]
						 * @returns { string }
						 */
						var rv = function(arg,index) {
							if (arguments.length == 1) index = null;
							var label = (typeof(index) == "number") ? "property 'arguments[" + String(index) + "]'" : "property 'command'";
							if (typeof(arg) == "undefined") {
								throw new ArgumentError(label + " cannot be undefined");
							}
							if (arg === null) throw new ArgumentError(label + " must not be null");
							if (arg && typeof(arg) == "object") return String(arg);
							//	TODO	the below check does not allow the empty string to be a token
							if (arg && typeof(arg) == "string") return arg;
							throw new ArgumentError(label + " is not a string nor an object that can be converted to string.");
						}
						rv.Error = ArgumentError;
						return rv;
					}
				)();

				/**
				 *
				 * @param { slime.jrunscript.java.Environment } environment
				 * @param { slime.jrunscript.shell.sudo.Settings } settings
				 * @returns { slime.jrunscript.java.Environment }
				 */
				var getEnvironmentToSudo = function(environment, settings) {
					return $api.Object.compose(
						environment,
						(settings && settings.askpass) ? { SUDO_ASKPASS: settings.askpass } : {}
					)
				}

				/**
				 *
				 * @param { string } command
				 * @param { string[] } args
				 * @param { slime.jrunscript.shell.sudo.Settings } settings
				 * @returns { string[] }
				 */
				var getArgumentsToSudo = function(command, args, settings) {
					return $api.Array.build(function(array) {
						if (settings && settings.askpass) array.push("--askpass");
						if (settings && settings.nocache) array.push("--reset-timestamp")
						array.push(command);
						array.push.apply(array, args);
					});
				}

				/** @type { (defaults: slime.jrunscript.shell.run.internal.Parent) => slime.jrunscript.shell.exports.Invocation["from"]["argument"] } */
				var create = function(defaults) {
					return function(p) {
						return {
							context: {
								environment: (p.environment) ? p.environment : defaults.environment,
								directory: (p.directory) ? p.directory.toString() : defaults.directory,
								stdio: {
									input: (function() {
										if (p.stdio && p.stdio.input) return toInputStream(p.stdio.input);
										return null;
									})(),
									output: (p.stdio && p.stdio.output) ? p.stdio.output : defaults.stdio.output,
									error: (p.stdio && p.stdio.error) ? p.stdio.error : defaults.stdio.error,
								}
							},
							configuration: {
								command: String(p.command),
								arguments: (p.arguments) ? p.arguments.map(String) : []
							}
						}
					}
				};

				/** @type { slime.jrunscript.shell.internal.invocation.Export["internal"]["old"] } */
				var internal = (
					function() {
						return {
							error: {
								BadCommandToken: parseCommandToken.Error
							},
							parseCommandToken: parseCommandToken
						}
					}
				)();

				return {
					exports: function(defaults) {
						//	TODO	this being undefined is just for testing at the moment, should think through how to make this less kludgy
						var withDefaults = (defaults) ? create(defaults) : void(0);
						return {
							from: {
								argument: withDefaults
							},
							create: (withDefaults) ? $api.deprecate(withDefaults) : void(0),
							//	TODO	sudo has preserve-env and preserver-env= flags. Should make the relationship more explicit
							//			between that and the environment provided normally, e.g., how could we pass an explicit environment
							//			to sudo? Maybe by transforming the command into an `env` command?
							sudo: function(settings) {
								return function(invocation) {
									return {
										context: {
											environment: getEnvironmentToSudo(invocation.context.environment, settings),
											directory: invocation.context.directory,
											stdio: invocation.context.stdio
										},
										configuration: {
											command: "sudo",
											arguments: getArgumentsToSudo(invocation.configuration.command, invocation.configuration.arguments, settings)
										}
									}
								}
							},
							handler: {
								stdio: {
									line: function(f) {
										var lastBlank = null;

										return function(e) {
											if (lastBlank) {
												f(lastBlank);
												lastBlank = null;
											}
											if (e.detail.line == "") {
												lastBlank = e;
											} else {
												f(e);
											}
										}
									}
								}
							}
						}
					},
					invocation: {
						//	The returned function is wrapped in this function because one could envision this function someday having
						//	arguments containing some sort of information about how the script should be authored, maybe the path
						//	to bash (which is different on FreeBSD), and so forth.
						toBashScript: $api.deprecate(function() {
							/** @type { ReturnType<slime.jrunscript.shell.Exports["invocation"]["toBashScript"]> } */
							var toScriptCode = function(invocation) {
								return $api.Array.build(function(script) {
									script.push("#!/bin/bash");

									if (invocation.directory) {
										if (typeof(invocation.directory) == "string") {
											script.push("cd " + invocation.directory);
										} else {
											script.push("cd " + invocation.directory.pathname.toString());
										}
									}

									/** @type { Parameters<ReturnType<slime.jrunscript.shell.Exports["invocation"]["toBashScript"]>>[0]["environment"]} */
									var environment = (invocation.environment) || { inherit: void(0), values: {} };
									var inherit = (typeof(environment.inherit) == "undefined") ? true : environment.inherit;
									var values = (typeof(environment.values) == "undefined") ? {} : environment.values;
									var set = Object.entries(values).filter(function(entry) {
										return typeof(entry[1]) == "string";
									});
									var unset = Object.entries(values).filter(function(entry) {
										return entry[1] === null;
									});

									script.push($api.Array.build(function(rv) {
										if (!inherit || set.length || unset.length) rv.push("env");
										unset.forEach(function(entry) {
											rv.push("-u", entry[0]);
										});
										set.forEach(function(entry) {
											rv.push(entry[0] + "=" + "\"" + entry[1] + "\"");
										});
										rv.push(invocation.command);
										if (invocation.arguments) rv.push.apply(rv, invocation.arguments);
									}).join(" "))
								}).join("\n");
							};

							return toScriptCode;
						})
					},
					internal: {
						old: internal
					}
				};
			}
		)($api,{ library: { io: $context.api.io }})

		/**
		 * Returns a stdio object given the argument, using the `stdio` property of the argument if it is available, then using
		 * the deprecated `stdin`, `stdout`, and `stderr` if needed, and finelly returning an empty object. May return `null` if
		 * the `stdio` property is `null`.
		 *
		 * @param { slime.jrunscript.shell.run.minus2.Argument } p
		 * @return { slime.jrunscript.shell.invocation.old.Argument["stdio"] }
		 */
		function extractStdioIncludingEmptyAndDeprecatedForms(p) {
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

		var parseCommandToken = invocation.internal.old.parseCommandToken;
		var BadCommandToken = invocation.internal.old.error.BadCommandToken;

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.invocation.Configuration } p
		 * @returns { slime.jrunscript.shell.internal.run.java.Configuration }
		 */
		var old_toConfiguration = function(p) {
			return {
				command: parseCommandToken(p.command),
				arguments: (p.arguments) ? p.arguments.map(parseCommandToken) : []
			}
		}

		/**
		 * Fills the argument in with an empty input if the input is missing, and the parent's corresponding output/error stream if
		 * those are missing.
		 *
		 * @param { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed } p
		 * @param { slime.jrunscript.shell.parent.Stdio } parent
		 */
		var fallbackToParentStdio = function(p, parent) {
			if (typeof(p.input) == "undefined") p.input = null;
			/** @type { slime.jrunscript.shell.run.internal.SubprocessOutputStreamIdentity[] } */
			var streams = ["output","error"];
			streams.forEach(function(property) {
				if (typeof(p[property]) == "undefined" && parent) p[property] = $api.Object.compose(parent[property], { close: function(){} });
			})
		}

		/**
		 * @param { Pick<slime.jrunscript.shell.invocation.old.Argument, "stdio" | "environment" | "directory"> } p
		 * @param { slime.jrunscript.java.Environment } parentEnvironment
		 * @param { slime.jrunscript.shell.parent.Stdio } parentStdio
		 * @returns { slime.jrunscript.shell.run.minus2.Context }
		 */
		var toContext = function(p, parentEnvironment, parentStdio) {

			/**
			 *
			 * @param { { directory?: slime.jrunscript.file.Directory, workingDirectory?: slime.jrunscript.file.Directory } } p
			 * @return { string }
			 */
			function directoryForModuleRunArgument(p) {
				/**
				 *
				 * @param { { directory?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["directory"] } } p
				 * @return { slime.jrunscript.file.Directory }
				 */
				var getDirectoryProperty = function(p) {
					if (p.directory && p.directory.pathname) {
						return p.directory;
					}
				}

				if (p.directory) {
					return getDirectoryProperty(p).toString();
				}
				if (p.workingDirectory) {
					return $api.deprecate(getDirectoryProperty)({ directory: p.workingDirectory }).toString();
				}
			}

			var stdio1 = updateForStringInput(p.stdio);
			fallbackToParentStdio(stdio1, parentStdio);
			var stdio = toStdioConfiguration(stdio1);
			return {
				stdio: stdio,
				environment: (function(now, argument) {
					if (typeof(argument) == "undefined") return now;
					if (argument === null) return now;
					if (typeof(argument) == "object") return argument;
					if (typeof(argument) == "function") {
						var rv = Object.assign({}, now);
						return $api.fp.mutating(argument)(rv);
					}
				})(parentEnvironment, p.environment),
				directory: directoryForModuleRunArgument(p)
			}
		}

		/**
		 *
		 * @param { Parameters<slime.jrunscript.shell.Exports["run"]>[0] } p
		 * @param { slime.jrunscript.shell.run.minus2.Events } events
		 */
		var run = function(p,events) {
			var as;
			if (p.as) {
				as = p.as;
			}

			p.stdio = extractStdioIncludingEmptyAndDeprecatedForms(p);

			var context = toContext(p, $context.environment, $context.stdio);

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
						 * @param { slime.jrunscript.shell.invocation.old.Token } v
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
							/** @type { slime.jrunscript.shell.invocation.old.Token[] } */
							var full = [command];
							if (args) full = full.concat(args);
							return full.map(toErrorMessageString).join(" ");
						};

						try {
							return old_toConfiguration({
								command: command,
								arguments: args
							});
						} catch (e) {
							if (e instanceof BadCommandToken) {
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
			 * @type { slime.jrunscript.shell.run.minus2.Argument }
			 */
			var input = {
				command: invocation.result.command,
				arguments: invocation.result.arguments,
				environment: context.environment,
				directory: directory
			};
			input.workingDirectory = directory;
			$api.deprecate(input,"workingDirectory");

			var result = $context.scripts.run.old.run(context, invocation.configuration, $context.module, events, p, input, isLineListener);

			var evaluate = (p["evaluate"]) ? p["evaluate"] : $exports.run.evaluate;
			return evaluate($api.Object.compose(input, result));
		};

		/** @type { slime.jrunscript.shell.internal.run.old.Exports } */
		var $exports = {
			run: void(0),
			invocation: invocation,
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

		$exports.run.stdio = {
			run: function getStdio(p) {
				//	TODO	the getStdio function is currently used in jsh.js, requiring us to export it; is that the best structure?
				var stdio = extractStdioIncludingEmptyAndDeprecatedForms(p);

				if (stdio) {
					//	TODO	the below $api.Events() is highly dubious, inserted just to get past TypeScript; who knows
					//			whether it will work but refactoring in progress may change it further
					var fixed = updateForStringInput(stdio);
					fallbackToParentStdio(fixed, $context.stdio);
					var x = toStdioConfiguration(fixed);
					var rv = $context.scripts.run.internal.buildStdio(x)($api.Events());
					return rv;
				} else {
					//	TODO	stdio could be null if p.stdio === null. What would that mean? And what does $context.stdio have
					//			to do with it?
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
			},
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
		};

		$export($exports);
	}
//@ts-ignore
)($api,$context,$export);
