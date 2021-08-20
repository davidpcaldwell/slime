//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.loader.Export<slime.jrunscript.shell.internal.invocation.Export> } $export
	 */
	function($api,$export) {
		/**
		 *
		 * @param { Parameters<slime.jrunscript.shell.Exports["run"]>[0] } p
		 * @return { Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"] }
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

		$export({
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
			},
			stdio: {
				forModuleRunArgument: extractStdioIncludingDeprecatedForm
			},
			directory: {
				forModuleRunArgument: directoryForModuleRunArgument
			}
		})
	}
//@ts-ignore
)($api,$export);
