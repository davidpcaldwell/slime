//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export interface Stdio {
		input?: slime.jrunscript.runtime.io.InputStream
		output?: slime.jrunscript.runtime.io.OutputStream
		error?: slime.jrunscript.runtime.io.OutputStream
	}

	interface Result {
	}

	interface java {
		(p: {
			vmarguments?: any
			properties?: any
			jar: any
			arguments: any
		}): Result

		(p: {
			vmarguments?: any
			properties?: any
			classpath: any
			main: any
			arguments: any
			environment: any
		}): Result

		version: string

		keytool: any

		launcher: slime.jrunscript.file.File

		jrunscript: any
		home: any
	}

	export interface Context {
		stdio: Stdio
		_environment: slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		_properties: slime.jrunscript.native.java.util.Properties
		kotlin: {
			compiler: slime.jrunscript.file.File
		}
		api: {
			js: slime.runtime.old.Exports
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			document: any
			httpd: any
			xml: any
		}
	}

	export interface Exports {
		listeners: $api.Events<{
			"run.start": any
		}>["listeners"]
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.listeners = function() {
				const jsh = fifty.global.jsh;

				var subject: Exports = jsh.shell;

				var command = jsh.shell.PATH.getCommand("true");

				var log = (function() {
					var events = [];
					var listener: $api.event.Handler<any> = function(e) {
						events.push(e);
					};
					return {
						listener: listener,
						captured: function() {
							return events;
						}
					}
				})();

				subject.listeners.add("run.start", log.listener);

				fifty.verify(log).captured().length.is(0);

				subject.run({
					command: command
				});

				fifty.verify(log).captured().length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * An object representing the environment provided via the {@link Context}, or representing the system environment if
		 * no environment was provided via the `Context`.
		 */
		environment: slime.jrunscript.host.Environment
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.environment = function() {
				const jsh = fifty.global.jsh;

				var fixtures: slime.jrunscript.native.inonit.system.test.Fixtures = fifty.$loader.file("../../rhino/system/test/system.fixtures.ts");
				var o = fixtures.OperatingSystem.Environment.create({
					values: { foo: "bazz" },
					caseSensitive: true
				});
				fifty.verify(String(o.getValue("foo"))).is("bazz");

				var module: Exports = fifty.$loader.module("module.js", {
					_environment: o,
					api: {
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						js: jsh.js
					}
				});
				fifty.verify(module).environment.evaluate.property("foo").is("bazz");
				fifty.verify(module).environment.evaluate.property("xxx").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface World {
	}

	export namespace run {
		export interface Stdio {
			output?: string
			error?: string
		}

		export interface Argument extends invocation.Argument {
			as?: any
			on?: any
			/** @deprecated */
			tokens?: any
			/** @deprecated */
			workingDirectory?: slime.jrunscript.file.Directory
			/** @deprecated */
			stdout?: invocation.Argument["stdio"]["output"]
			/** @deprecated */
			stdin?: invocation.Argument["stdio"]["input"]
			/** @deprecated */
			stderr?: invocation.Argument["stdio"]["error"]
		}

		export interface Result {
			command: any
			arguments: any[]
			environment: any

			directory: slime.jrunscript.file.Directory
			/** @deprecated */
			workingDirectory: slime.jrunscript.file.Directory

			status: number
			stdio?: run.Stdio
		}
	}

	export interface Exports {
		//	environment (maybe defined erroneously in jsh.d.ts)

		//	listeners
		run: {
			<T>(p: run.Argument & {
				evaluate?: (p: run.Result) => T
			}, events?: any): T

			(p: run.Argument, events?: any): run.Result

			evaluate: any
			stdio: any
		}

		//	TODO	probably should be conditional based on presence of sudo tool
		/**
		 * Creates an object that can execute invocations under `sudo` using the settings given.
		 */
		sudo: (settings?: Parameters<Exports["invocation"]["sudo"]>[0]) => {
			run: (invocation: invocation.Argument) => any
		}

		//	fires started, exception, stdout, stderr
		/**
		 * Provides a framework for embedding processes inside a shell. Invokes the given method with the given argument
		 */
		embed: (p: {
			method: Function
			argument: object
			started: (p: { output?: string, error?: string }) => boolean
		}, events: $api.events.Function.Receiver) => void

		properties: {
			object: any

			/**
			 * Returns the value of the specified system property, or `null` if it does not have a value.
			 *
			 * @param name
			 */
			get(name: string): string

			file(name: any): any
			directory(name: any): any
			searchpath(name: any): any
		}

		TMPDIR: slime.jrunscript.file.Directory
		USER: string
		HOME: slime.jrunscript.file.Directory

		PWD: slime.jrunscript.file.Directory
		PATH?: any

		os: {
			name: string
			arch: string
			version: string
			newline: string
			resolve: any
			process?: {
				list: slime.jrunscript.shell.system.ps
			}
			sudo?: slime.jrunscript.shell.system.sudo
			ping?: slime.jrunscript.shell.system.Exports["ping"]

			//	TODO	should not depend on jsh; need to disentangle jsh["ui"] from jsh first and have a separate TypeScript
			//			definition for something like slime.jrunscript.ui or something
			inject: (dependencies: { ui: slime.jsh.Global["ui"] }) => void
		}

		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		//	browser

		system: any

		java: java

		jrunscript: any

		kotlin: any

		/** @deprecated Presently unused. */
		rhino: any

		world: World
	}

	export type Loader = slime.loader.Product<Context,Exports>;

	export interface Exports {
		/** @deprecated Replaced by `world.Invocation` because it relies on external state. */
		Invocation: (p: invocation.Argument) => Invocation
	}

	export interface World {
		run: (invocation: Invocation) => slime.$api.fp.impure.Tell<{
			exit: number
		}>

		/**
		 * Creates a fully-specified {@link Invocation} from a given {@link invocation.Argument} and the surrounding context.
		 */
		Invocation: (p: invocation.Argument) => Invocation
	}

	(
		function(
			$api: slime.$api.Global,
			fifty: slime.fifty.test.kit
		) {
			const subject = fifty.global.jsh.shell;

			fifty.tests.sandbox = function() {
				var bogus: Invocation = subject.world.Invocation({
					command: "foobarbaz"
				});

				(function() {
					var tell = subject.world.run(bogus);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.type(Error);
					fifty.verify(tell).evaluate(function(f) { return f(); }).threw.name.is("JavaException");
				})();

				var directory = fifty.$loader.getRelativePath(".").directory;

				if (fifty.global.jsh.shell.PATH.getCommand("ls")) {
					var ls = subject.world.Invocation({
						command: "ls",
						directory: directory
					});
					var status: number;
					subject.world.run(ls)({
						exit: function(e) {
							status = e.detail;
						}
					});
					fifty.verify(status).is(0);

					fifty.run(function checkExitStatus() {
						var lserror = $api.Object.compose(ls, {
							arguments: ["--foo"]
						});
						var status: number;
						subject.world.run(lserror)({
							exit: function(e) {
								status = e.detail;
							}
						});
						fifty.verify(status).is(1);
					});

					fifty.run(function checkErrorOnNonZero() {
						var lserror = $api.Object.compose(ls, {
							arguments: ["--foo"]
						});
						var tell = subject.world.run(lserror);
						fifty.verify(tell).evaluate(function(f) { return f(); }).threw.type(Error);
						fifty.verify(tell).evaluate(function(f) { return f(); }).threw.message.is("Non-zero exit status: 1");
					});
				}

				var isDirectory = function(directory) {
					return Object.assign(function(p) {
						return directory.toString() == p.toString();
					}, {
						toString: function() {
							return "is directory " + directory;
						}
					})
				};

				var it = {
					is: function(value) {
						return function(p) {
							return p === value;
						}
					}
				}

				fifty.run(function Invocation() {
					var directory = fifty.$loader.getRelativePath(".").directory;

					//	TODO	test for missing command

					fifty.run(function defaults() {
						var argument: invocation.Argument = {
							command: "ls"
						};
						var invocation = fifty.global.jsh.shell.world.Invocation(argument);
						fifty.verify(invocation, "invocation", function(its) {
							its.command.is("ls");
							its.arguments.is.type("object");
							its.arguments.length.is(0);
							//	TODO	environment
							its.directory.evaluate(isDirectory(fifty.global.jsh.shell.PWD)).is(true);
							its.stdio.input.evaluate(it.is(null)).is(true);
							its.stdio.output.evaluate(it.is(fifty.global.jsh.shell.stdio.output)).is(true);
							its.stdio.error.evaluate(it.is(fifty.global.jsh.shell.stdio.error)).is(true);
						});
					});

					fifty.run(function specified() {
						var argument: invocation.Argument = {
							command: fifty.global.jsh.file.Pathname("/bin/ls"),
							arguments: [directory.getRelativePath("invocation.fifty.ts")],
							//	TODO	environment
							directory: directory
						};
						var invocation = fifty.global.jsh.shell.world.Invocation(argument);
						fifty.verify(invocation, "invocation", function(its) {
							its.command.is("/bin/ls");
							its.arguments.is.type("object");
							its.arguments.length.is(1);
							its.arguments[0].is(directory.getRelativePath("invocation.fifty.ts").toString());
							its.directory.evaluate(isDirectory(directory)).is(true);
						});
					});
				});
			}
		}
	//@ts-ignore
	)($api,fifty);

	export namespace internal.module {
		export type RunStdio = Required<slime.jrunscript.shell.Stdio> & { close: () => void }
	}

	(
		function(fifty: slime.fifty.test.kit) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.listeners);
				fifty.run(fifty.tests.environment);

				fifty.load("invocation.fifty.ts");

				fifty.run(fifty.tests.sandbox);
			}
		}
	//@ts-ignore
	)(fifty)
}