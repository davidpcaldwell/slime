//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.test {
	export interface Context {
	}

	export namespace run {
		export type Delegate = (invocation: slime.jrunscript.shell.run.Invocation) => slime.jrunscript.shell.run.Mock
	}

	export interface Fixtures {
		run: {
			createMockWorld: (delegate: run.Delegate) => slime.jrunscript.shell.run.World
		}
	}

	(
		function($context: Context, $export: slime.loader.Export<Fixtures>) {
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

			var createMockWorld = function(delegate: slime.jrunscript.shell.test.run.Delegate): slime.jrunscript.shell.run.World {
				return {
					start: function(p) {
						var killed = false;

						var result = delegate({
							context: p.context,
							configuration: p.configuration
						});
						return {
							pid: result.pid || 0,
							kill: function() {
								killed = true;
							},
							run: function() {
								var stdio = p.context.stdio;
								var events = p.events;

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
				run: {
					createMockWorld: createMockWorld
				}
			})
		}
	//@ts-ignore
	)($context,$export);

	export type Script = slime.loader.Script<Context,Fixtures>
}
