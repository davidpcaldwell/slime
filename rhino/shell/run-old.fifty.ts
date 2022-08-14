//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export interface Exports {
		run: {
			<T>(
				p: run.old.Argument & {
					evaluate?: (p: run.old.Result) => T
				},
				events?: run.old.Handler
			): T

			(p: run.old.Argument, events?: run.old.Events): run.old.Result

			evaluate: any
			stdio: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var getJavaProgram = function(name) {
				var jsh = fifty.global.jsh;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/" + name + ".java")]
				});
				return {
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test." + name
				}
			};

			fifty.tests.run = function() {
				var subject: Exports = fifty.global.jsh.shell;

				var here: slime.jrunscript.file.Directory = fifty.jsh.file.object.getRelativePath(".").directory;

				var on = {
					start: void(0)
				}

				var argument: slime.jrunscript.shell.run.old.Argument = {
					command: "ls",
					directory: here,
					on: {
						start: function(target) {
							on.start = target;
						}
					}
				};

				var captured: run.old.events.Events = {
					start: void(0),
					terminate: void(0)
				};

				var events = {
					start: function(e) {
						fifty.global.jsh.shell.console("start!");
						captured.start = e.detail;
					},
					terminate: function(e) {
						fifty.global.jsh.shell.console("terminate!");
						captured.terminate = e.detail;
					}
				};

				fifty.verify(on).start.is.type("undefined");

				subject.run(argument, events);

				//	TODO	appears to work in latest version of TypeScript
				//@ts-ignore
				fifty.verify(captured).start.command.evaluate(function(p) { return String(p) }).is("ls");
				fifty.verify(captured).start.directory.evaluate(function(directory) { return directory.toString(); }).is(here.toString());
				fifty.verify(captured).start.pid.is.type("number");
				fifty.verify(captured).start.kill.is.type("function");

				fifty.verify(captured).terminate.status.is(0);

				fifty.verify(on).start.is.type("object");

				fifty.run(function argumentChecking() {
					fifty.verify(subject).evaluate(function() {
						this.run({
							command: null
						})
					}).threw.message.is("property 'command' must not be null; full invocation = (null)");
					fifty.verify(subject).evaluate(function() {
						this.run({
							command: "java",
							arguments: [null]
						})
					}).threw.message.is("property 'arguments[0]' must not be null; full invocation = java (null)");
				});

				fifty.run(fifty.tests.run.stdio);

				fifty.run(function directory() {
					var jsh = fifty.global.jsh;
					var module = subject;

					var program = getJavaProgram("Directory");
					var dir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var result = module.java({
						classpath: program.classpath,
						main: program.main,
						stdio: {
							output: String
						},
						directory: dir
					});
					var workdir = result.stdio.output;
					fifty.verify(workdir).is(dir.toString());
				})
			}
			fifty.tests.run.stdio = function() {
				var subject: Exports = fifty.global.jsh.shell;
				var jsh = fifty.global.jsh;
				var module = subject;
				var verify = fifty.verify;

				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/Echo.java")]
				});
				var result = module.java({
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test.Echo",
					stdio: {
						input: "Hello, World!",
						output: String
					}
				});
				verify(result).stdio.output.is("Hello, World!");

				var runLines = function(input) {
					var buffered = [];
					var rv = module.java({
						classpath: jsh.file.Searchpath([to.pathname]),
						main: "inonit.jsh.test.Echo",
						stdio: {
							input: input,
							output: {
								line: function(string) {
									buffered.push(string);
								}
							}
						}
					});
					return {
						stdio: {
							output: buffered
						}
					};
				};

				var lines: { stdio: { output: string[] }};
				var nl = jsh.shell.os.newline;
				lines = runLines("Hello, World!" + nl + "Line 2");
				verify(lines).stdio.output.length.is(2);
				verify(lines).stdio.output[0].is("Hello, World!");
				verify(lines).stdio.output[1].is("Line 2");
				lines = runLines("Hello, World!" + nl + "Line 2" + nl);
				verify(lines).stdio.output.length.is(3);
				verify(lines).stdio.output[0].is("Hello, World!");
				verify(lines).stdio.output[1].is("Line 2");
				verify(lines).stdio.output[2].is("");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.shell.internal.run.old {
	export interface Context {
		environment: slime.jrunscript.host.Environment
		stdio: slime.jrunscript.shell.invocation.Stdio
		api: {
			file: slime.jrunscript.file.Exports
		}
		os: {
			name: () => string
			newline: () => string
		}
		scripts: {
			invocation: slime.jrunscript.shell.internal.invocation.Export
			run: slime.jrunscript.shell.internal.run.Exports
		}
		module: {
			events: $api.Events<any>
		}
	}

	export interface Exports {
		run: slime.jrunscript.shell.Exports["run"]
		$run: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.run);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
