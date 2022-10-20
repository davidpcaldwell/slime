//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.shell.internal.invocation.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.shell.internal.invocation.Export> } $export
	 */
	function($api,$context,$export) {
		var parseCommandToken = (
			function() {
				var ArgumentError = $api.Error.old.Type({ name: "ArgumentError", extends: TypeError });

				/**
				 *
				 * @param { slime.jrunscript.shell.invocation.Token } arg
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
		 * @param { slime.jrunscript.shell.internal.invocation.Configuration } p
		 * @returns { slime.jrunscript.shell.internal.run.java.Configuration }
		 */
		var toConfiguration = function(p) {
			return {
				command: parseCommandToken(p.command),
				arguments: (p.arguments) ? p.arguments.map(parseCommandToken) : []
			}
		}

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

		/**
		 *
		 * @param { slime.jrunscript.shell.invocation.Input } p
		 * @return { slime.jrunscript.runtime.io.InputStream }
		 */
		var toInputStream = function(p) {
			if (typeof(p) == "string") {
				var buffer = new $context.library.io.Buffer();
				buffer.writeText().write(p);
				buffer.close();
				return buffer.readBinary();
			} else {
				return p;
			}
		}

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
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed } p
		 * @param { slime.jrunscript.shell.invocation.Stdio } parent
		 */
		var fallbackToParentStdio = function(p, parent) {
			if (typeof(p.input) == "undefined") p.input = null;
			["output","error"].forEach(function(property) {
				if (typeof(p[property]) == "undefined" && parent) p[property] = parent[property];
			})
		}

		/**
		 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
		 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToLines }
		 */
		var isLineListener = function(configuration) {
			return configuration && Object.prototype.hasOwnProperty.call(configuration, "line");
		}

		/**
		 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
		 * @return { configuration is slime.jrunscript.shell.invocation.old.OutputStreamToString }
		 */
		var isString = function(configuration) {
			return configuration === String
		};

		/**
		 * @param { slime.jrunscript.shell.invocation.old.OutputStreamConfiguration } configuration
		 * @return { configuration is slime.jrunscript.shell.invocation.OutputStreamToStream }
		 */
		var isRaw = function(configuration) {
			return true;
		}

		/** @type { (configuration: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => slime.jrunscript.shell.invocation.OutputCapture } */
		var toCapture = function(configuration) {
			if (isLineListener(configuration)) {
				return "line";
			} else if (isString(configuration)) {
				return "string";
			} else {
				return configuration;
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.invocation.StdioWithInputFixed } declaration
		 * @return { slime.jrunscript.shell.run.StdioConfiguration }
		 */
		function toStdioConfiguration(declaration) {
			return {
				input: declaration.input,
				output: toCapture(declaration.output),
				error: toCapture(declaration.error)
			};
		}

		/**
		 * @param { Pick<slime.jrunscript.shell.invocation.old.Argument, "stdio" | "environment" | "directory"> } p
		 * @param { slime.jrunscript.host.Environment } parentEnvironment
		 * @param { slime.jrunscript.shell.invocation.Stdio } parentStdio
		 * @returns { slime.jrunscript.shell.run.Context }
		 */
		var toContext = function(p, parentEnvironment, parentStdio) {
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
		 * @param { slime.jrunscript.shell.old.Invocation } invocation
		 * @returns { slime.jrunscript.shell.run.Invocation }
		 */
		var modernize = function(invocation) {
			return {
				context: {
					environment: invocation.environment,
					directory: invocation.directory.toString(),
					stdio: toStdioConfiguration(updateForStringInput(invocation.stdio))
				},
				configuration: {
					command: invocation.command,
					arguments: invocation.arguments
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.host.Environment } environment
		 * @param { slime.jrunscript.shell.sudo.Settings } settings
		 * @returns { slime.jrunscript.host.Environment }
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

		/** @type { slime.jrunscript.shell.internal.invocation.Export["create"] } */
		var create = function(defaults) {
			return function(p) {
				return {
					context: {
						environment: (p.environment) ? p.environment : defaults.environment(),
						directory: (p.directory) ? p.directory.toString() : defaults.directory(),
						stdio: {
							input: (function() {
								if (p.stdio && p.stdio.input) return toInputStream(p.stdio.input);
								return null;
							})(),
							output: (p.stdio && p.stdio.output) ? p.stdio.output : defaults.stdio().output,
							error: (p.stdio && p.stdio.error) ? p.stdio.error : defaults.stdio().error,
						}
					},
					configuration: {
						command: String(p.command),
						arguments: (p.arguments) ? p.arguments.map(String) : []
					}
				}
			}
		};

		/** @type { slime.jrunscript.shell.internal.invocation.Export["old"] } */
		var old = function(defaults, toDirectory) {
			return function(p) {
				return {
					command: String(p.command),
					arguments: (p.arguments) ? p.arguments.map(String) : [],
					environment: (p.environment) ? p.environment : defaults.environment(),
					stdio: $api.Object.compose({
						input: null,
						output: defaults.stdio().output,
						error: defaults.stdio().error
					}, p.stdio),
					directory: (p.directory) ? p.directory : toDirectory(defaults.directory())
				};
			}
		};

		/** @type { slime.jrunscript.shell.internal.invocation.Export["internal"]["old"] } */
		var internal = (
			function() {
				return {
					error: {
						BadCommandToken: parseCommandToken.Error
					},
					updateForStringInput: updateForStringInput,
					fallbackToParentStdio: fallbackToParentStdio,
					toStdioConfiguration: toStdioConfiguration,
					toConfiguration: toConfiguration,
					isLineListener: isLineListener,
					toContext: toContext
				}
			}
		)();

		$export({
			modernize: modernize,
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
			invocation: {
				sudo: function(settings) {
					//	TODO	sudo has preserve-env and preserver-env= flags. Should make the relationship
					//			more explicit
					//			between that and the environment provided normally, e.g., how could we pass an explicit environment
					//			to sudo? Maybe by transforming the command into an `env` command?
					return function(invocation) {
						return $api.Object.compose(invocation, {
							command: "sudo",
							arguments: $api.Array.build(function(array) {
								if (settings && settings.askpass) array.push("--askpass");
								if (settings && settings.nocache) array.push("--reset-timestamp")
								array.push(invocation.command);
								array.push.apply(array, invocation.arguments);
							}),
							environment: $api.Object.compose(
								invocation.environment,
								(settings && settings.askpass) ? { SUDO_ASKPASS: settings.askpass } : {}
							),
							directory: invocation.directory,
							stdio: invocation.stdio
						});
					}
				},
				//	The returned function is wrapped in this function because one could envision this function someday having
				//	arguments containing some sort of information about how the script should be authored, maybe the path
				//	to bash (which is different on FreeBSD), and so forth.
				toBashScript: function() {
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
				}
			},
			create: create,
			old: old,
			internal: {
				old: internal
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
