//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 *
	 * @template { {} } T
	 */
	function($api,jsh) {
		var $$api = {
			Function: {
				RegExp: {
					/**
					 * @template { any } T
					 * @param { { pattern: RegExp, match: (p: RegExpMatchArray) => T } } p
					 * @returns { (s: string) => slime.$api.fp.Maybe<T> }
					 */
					processor: function(p) {
						return function(string) {
							var match = p.pattern.exec(string);
							if (match) {
								return $api.Function.Maybe.value(p.match(match));
							} else {
								return $api.Function.Maybe.nothing();
							}
						}
					}
				}
			}
		}
		if (!jsh.wf.project.base) {
			jsh.shell.console("No wf project base defined; PROJECT = " + jsh.shell.environment.PROJECT);
			jsh.shell.exit(1);
		}

		if (!jsh.wf.project.base.getFile("wf.js")) {
			jsh.shell.console("Directory " + jsh.wf.project.base + " does not appear to be a project directory; no wf.js found.");
			jsh.shell.exit(1);
		}

		/** @type { slime.jsh.script.cli.Descriptor<T> } */
		var descriptor = {
			options: $api.Function.cast,
			commands: new jsh.file.Loader({ directory: jsh.wf.project.base }).module("wf.js", {
				base: jsh.wf.project.base
			})
		}

		/** @type { slime.jsh.script.cli.Commands<T> & { initialize?: slime.jsh.script.cli.Command<T> } } */
		var project = descriptor.commands;

		var invocation = jsh.script.cli.invocation(descriptor.options);

		/** @type { slime.js.Cast<T> } */
		var toT = $api.Function.cast;

		if (invocation.arguments[0] != "initialize" && project.initialize) {
			project.initialize({
				options: toT({}),
				arguments: []
			});
		}

		var gitHookProcessor = $$api.Function.RegExp.processor({
			pattern: /^git.hook.(.*)$/,
			match: function(match) {
				/** @type { (v: any) => v is slime.jsh.script.cli.error.TargetNotFound } */
				var isTargetNotFound = function(v) {
					return command instanceof jsh.script.cli.error.TargetNotFound;
				}

				/** @type { (v: any) => v is slime.jsh.script.cli.error.TargetNotFunction } */
				var isTargetNotFunction = function(v) {
					return command instanceof jsh.script.cli.error.TargetNotFunction;
				}

				var command = jsh.script.cli.Commands.getCommand(descriptor.commands, invocation.arguments[0]);
				if (isTargetNotFound(command)) {
					//	Probably fine, do nothing, hook is just not defined
					return function() {
						return 0;
					};
				} else if (isTargetNotFunction(command)) {
					return function() {
						throw new Error("Not a function: " + invocation.arguments[0]);
						return 1;
					}
					//	unsure what to do, think it through
				} else {
					//	TODO	this weird redeclaration should not be needed; type narrowing should apply to `command` here
					var target = command;
					//	probably run the hook?
					return function() {
						return target({
							options: invocation.options,
							arguments: []
						});
					}
				}
			}
		});

		var hook = gitHookProcessor(invocation.arguments[0]);

		if (hook.present) {
			var status = hook.value();
			try {
				if (typeof(status) == "number") {
					jsh.shell.exit(status);
				}
			} catch (e) {
				jsh.shell.console(e);
				jsh.shell.console(e.stack);
				jsh.shell.exit(1);
			}
		} else {
			jsh.script.cli.wrap(
				descriptor
			)
		}

		// var getCommand = function(project,command) {
		// 	if (typeof(command) == "undefined") return void(0);
		// 	var rv = project;
		// 	var tokens = command.split(".");
		// 	for (var i=0; i<tokens.length; i++) {
		// 		if (rv) {
		// 			rv = rv[tokens[i]];
		// 		}
		// 	}
		// 	return rv;
		// };

		// var command = getCommand(project,parameters.command);

		// if (command) {
		// 	command({
		// 		options: parameters.options,
		// 		arguments: parameters.arguments
		// 	});
		// } else {
		// 	if (typeof(parameters.command) != "undefined") {
		// 		jsh.shell.console("Project at " + jsh.wf.project.base + " does not have a '" + parameters.command + "' command.");
		// 	}
		// 	var list = [];
		// 	getCommandList(list,project);
		// 	jsh.shell.console("Available wf commands for " + jsh.wf.project.base + ":");
		// 	jsh.shell.console(list.join("\n"));
		// }
	}
//@ts-ignore
)($api,jsh);
