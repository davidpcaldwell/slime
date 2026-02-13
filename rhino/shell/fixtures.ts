//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.test {
	export type Context = void

	export namespace run {
		export type OldInvocationDelegate = (invocation: slime.jrunscript.shell.run.minus2.Invocation) => slime.jrunscript.shell.run.Mock
	}

	export interface Fixtures {
		load: (context: slime.jrunscript.shell.Context) => slime.jrunscript.shell.Exports

		run: {
			/** @deprecated Uses older constructs. */
			createMockWorld: (delegate: run.OldInvocationDelegate) => slime.jrunscript.shell.internal.run.Context["world"]
		}
	}

	(
		function($context: Context, $loader: slime.Loader, $export: slime.loader.Export<Fixtures>) {
			var isLineWithProperty = function(name) {
				return function(line) {
					return Boolean(line[name]);
				}
			}

			var hasLineWithProperty = function(name) {
				return function(lines) {
					return lines && lines.some(isLineWithProperty(name));
				}
			};

			var createMockWorld = function(
				delegate: slime.jrunscript.shell.test.run.OldInvocationDelegate
			): slime.jrunscript.shell.internal.run.Context["world"]
			{
				return function(p) {
					return function(events) {
						var killed = false;

						var result = delegate({
							context: {
								directory: p.directory,
								environment: p.environment,
								stdio: p.stdio
							},
							configuration: {
								command: p.command,
								arguments: p.arguments
							}
						});
						return {
							pid: result.pid || 0,
							kill: function() {
								killed = true;
							},
							run: function() {
								var stdio = p.stdio;

								//	TODO	should emit at least one empty line for each if line buffering
								//	TODO	the below appears as though it would skip blank lines; should use isLineWithProperty and then
								//			fix that method
								if (result.lines) result.lines.forEach(function(line) {
									if (killed) return;
									if (stdio.output == "line" && line["stdout"]) {
										events.fire("stdout", { line: line["stdout"] });
									} else if (stdio.error == "line" && line["stderr"]) {
										events.fire("stderr", { line: line["stderr"] });
									}
								});

								/**
								 *
								 * @param { string } stdioName
								 * @param { string } eventName
								 * @returns { string }
								 */
								var getStdioProperty = function(stdioName, eventName) {
									if (stdio[stdioName] == "line" || stdio[stdioName] == "string") {
										if (hasLineWithProperty(eventName)(result.lines)) {
											return result.lines.filter(isLineWithProperty(eventName)).map(function(entry) {
												return entry[eventName]
											}).join("\n");
										}
										if (result.exit.stdio && result.exit.stdio[stdioName]) return result.exit.stdio[stdioName];
										return "";
									}
									return void(0);
								};

								if (!killed) {
									return {
										status: result.exit.status,
										stdio: {
											output: getStdioProperty("output", "stdout"),
											error: getStdioProperty("error", "stderr")
										}
									};
								} else {
									return {
										status: 143,
										//	TODO	the below is wrong, should terminate output and include only what happened
										//			before being killed
										stdio: {
											output: getStdioProperty("output", "stdout"),
											error: getStdioProperty("error", "stderr")
										}
									}
								}
							}
						}
					}
				}
			};

			$export({
				load: function(context) {
					var script: slime.jrunscript.shell.Script = $loader.script("module.js");
					return script(context);
				},
				run: {
					createMockWorld: createMockWorld
				}
			})
		}
	//@ts-ignore
	)($context,$loader,$export);

	export type Script = slime.loader.Script<Context,Fixtures>
}
