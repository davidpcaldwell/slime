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
				var ArgumentError = $api.Error.Type({ name: "ArgumentError", extends: TypeError });

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
		 * @return { slime.jrunscript.file.Directory }
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
				return getDirectoryProperty(p);
			}
			if (p.workingDirectory) {
				return $api.deprecate(getDirectoryProperty)({ directory: p.workingDirectory });
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.shell.internal.run.Stdio } p
		 * @param { slime.jrunscript.shell.Stdio } parent
		 */
		var fallbackToParentStdio = function(p, parent) {
			if (typeof(p.input) == "undefined") p.input = null;
			["output","error"].forEach(function(property) {
				if (typeof(p[property]) == "undefined" && parent) p[property] = parent[property];
			})
		}

		/**
		 *
		 * @param { { stdio?: slime.jrunscript.shell.invocation.Argument["stdio"] } } p
		 * @param { slime.jrunscript.shell.Stdio } parent
		 * @returns { (events: slime.$api.Events<slime.jrunscript.shell.internal.run.Events>) => slime.jrunscript.shell.internal.run.Stdio }
		 */
		var getStdio = function(p, parent) {
			return function(events) {
				var stdio = $context.run.buildStdio(p.stdio)(events);
				fallbackToParentStdio(stdio, parent);
				return stdio;
			}
		}

		/**
		 * @param { Pick<slime.jrunscript.shell.invocation.Argument, "stdio" | "environment" | "directory"> } p
		 * @param { slime.jrunscript.host.Environment } parentEnvironment
		 * @param { slime.jrunscript.shell.Stdio } parentStdio
		 * @returns { (events: slime.$api.Events<slime.jrunscript.shell.internal.run.Events>) => slime.jrunscript.shell.internal.run.java.Context }
		 */
		var toContext = function(p, parentEnvironment, parentStdio) {
			return function(events) {
				return {
					stdio: getStdio(p, parentStdio)(events),
					environment: (function(now, argument) {
						if (typeof(argument) == "undefined") return now;
						if (argument === null) return now;
						if (typeof(argument) == "object") return argument;
						if (typeof(argument) == "function") {
							var rv = Object.assign({}, now);
							return $api.Function.mutating(argument)(rv);
						}
					})(parentEnvironment, p.environment),
					directory: directoryForModuleRunArgument(p)
				}
			}
		}

		$export({
			error: {
				BadCommandToken: parseCommandToken.Error
			},
			toContext: toContext,
			fallbackToParentStdio: fallbackToParentStdio,
			toConfiguration: toConfiguration,
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
				toBashScript: function() {
					/** @type { (invocation: { command: string, arguments?: string[], directory?: slime.jrunscript.file.Directory } ) => string } */
					var toScriptCode = function(invocation) {
						return $api.Array.build(function(script) {
							script.push("#!/bin/bash");
							if (invocation.directory) script.push("cd " + invocation.directory.pathname.toString());
							script.push($api.Array.build(function(rv) {
								if (invocation.directory) rv.push("")
								rv.push(invocation.command);
								if (invocation.arguments) rv.push.apply(rv, invocation.arguments);
							}).join(" "))
						}).join("\n");
					};

					return toScriptCode;
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
