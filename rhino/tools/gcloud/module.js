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
	 * @param { slime.jrunscript.tools.gcloud.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.gcloud.Exports> } $export
	 */
	function($api,$context,$export) {
		var executeCommand = function(executable,account,project) {
			/** @type { slime.jrunscript.tools.gcloud.cli.Executor } */
			var rv = function(command) {
				return {
					argument: function(argument) {
						var toResult = command.result || $api.Function.identity;
						return {
							run: $api.Function.impure.ask(
								function(events) {
									var result;
									var invocation = command.invocation(argument);
									$context.library.shell.world.run(
										$context.library.shell.Invocation.create({
											//	TODO	could this dependency be narrowed to world filesystem rather than whole library?
											command: executable,
											arguments: $api.Array.build(function(rv) {
												if (account) rv.push("--account", account);
												if (project) rv.push("--project", project);
												rv.push("--format", "json");
												rv.push(invocation.command);
												rv.push.apply(rv, invocation.arguments);
											}),
											stdio: {
												output: "string",
												error: "line"
											}
										})
									)({
										stderr: function(e) {
											events.fire("console", e.detail.line);
										},
										exit: function(e) {
											if (e.detail.status != 0) throw new Error("Exit status: " + e.detail.status);
											var json = JSON.parse(e.detail.stdio.output);
											result = toResult(json);
										}
									});
									return result;
								}
							)
						}
					}
				}
			};

			return rv;
		}

		$export({
			cli: {
				Installation: {
					at: function at(installation) {
						if (typeof(installation) == "undefined") throw new TypeError("'installation' must not be undefined.");
						//	TODO	could this dependency be narrowed to world filesystem rather than whole library?
						var executable = $context.library.file.world.filesystems.os.Pathname.relative(installation, "bin/gcloud");
						return {
							account: function(account) {
								return {
									project: function(project) {
										return {
											command: executeCommand(executable,account,project)
										}
									},
									command: executeCommand(executable,account,void(0))
								}
							},
							command: executeCommand(executable,void(0),void(0))
						}
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
