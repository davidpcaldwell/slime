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

		/** @type { slime.jrunscript.shell.internal.invocation.Export["internal"]["old"] } */
		var internal = (
			function() {
				return {
					error: {
						BadCommandToken: parseCommandToken.Error
					},
					updateForStringInput: updateForStringInput,
					toStdioConfiguration: toStdioConfiguration,
					parseCommandToken: parseCommandToken,
					isLineListener: isLineListener
				}
			}
		)();

		$export({
			modernize: modernize,
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
			},
			invocation: {
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
			internal: {
				old: internal
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
