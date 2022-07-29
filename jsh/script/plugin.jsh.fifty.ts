//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.script {
	export namespace test {
		/**
		 * Represents the module inside the Fifty test suite.
		 */
		export const subject: Exports = (function(fifty: slime.fifty.test.Kit) {
			const jsh = fifty.global.jsh;
			const subject = jsh.script;
			return subject;
		//@ts-ignore
		})(fifty);
	}

	export namespace cli {
		export interface Invocation<T> {
			options: T
			arguments: string[]
		}

		export interface Processor<T,R> {
			(invocation: Invocation<T>): Invocation<R>
		}

		/**
		 * A process that may return a numeric exit status that can be used as a process exit status, or may complete normally, or
		 * may throw an uncaught exception.
		 */
		export interface Command<T> {
			(invocation: Invocation<T>): number | void
		}

		export interface Commands<T> {
			[x: string]: Commands<T> | Command<T>
		}

		export interface Descriptor<T> {
			options?: Processor<{},T>
			commands: Commands<T>
		}

		export interface Call<T> {
			command: Command<T>
			invocation: Invocation<T>
		}

		export type CallSearchResult<T> = Call<T>
			| slime.jsh.script.cli.error.NoTargetProvided
			| slime.jsh.script.cli.error.TargetNotFound
			| slime.jsh.script.cli.error.TargetNotFunction
	}

	export interface Exports {
		cli: cli.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.cli = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace cli {
		export interface Exports {
			Call: {
				parse: <T>(p: {
					commands: Commands<T>
					invocation: Invocation<T>
				}) => CallSearchResult<T>

				get: <T>(p: {
					descriptor: Descriptor<T>
					arguments: string[]
				}) => CallSearchResult<T>

				execute: <T>(p: {
					commands: Commands<T>
					call: CallSearchResult<T>
				}) => never | void
			}

			execute: <T>(p: {
				commands: Commands<T>
				invocation: Invocation<T>
			}) => never | void
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;

				var hello = function(p) {
				};

				fifty.tests.cli.Call = function() {
					var commands: Commands<{}> = {
						hello: hello
					};

					run(function parse() {
						var one = test.subject.cli.Call.parse({
							commands: commands,
							invocation: {
								options: {},
								arguments: ["hello"]
							}
						}) as slime.jsh.script.cli.Call<{}>;

						verify(one).evaluate.property("command").is(hello);
						verify(one).invocation.options.is.type("object");
						verify(one).invocation.arguments.length.is(0);

						var two = test.subject.cli.Call.parse({
							commands: commands,
							invocation: {
								options: {},
								arguments: ["hello", "world"]
							}
						}) as slime.jsh.script.cli.Call<{}>;

						verify(two).evaluate.property("command").is(hello);
						verify(two).invocation.options.is.type("object");
						verify(two).invocation.arguments.length.is(1);
						verify(two).invocation.arguments[0].is("world");
					});

					run(function get() {
						var descriptor = {
							commands: commands
						};

						var one = test.subject.cli.Call.get({
							descriptor: descriptor,
							arguments: ["hello"]
						}) as slime.jsh.script.cli.Call<{}>;

						verify(one).evaluate.property("command").is(hello);
						verify(one).invocation.options.is.type("object");
						verify(one).invocation.arguments.length.is(0);

						var two = test.subject.cli.Call.get({
							descriptor: descriptor,
							arguments: ["hello", "world"]
						}) as slime.jsh.script.cli.Call<{}>;

						verify(two).evaluate.property("command").is(hello);
						verify(two).invocation.options.is.type("object");
						verify(two).invocation.arguments.length.is(1);
						verify(two).invocation.arguments[0].is("world");
					});
				};

				fifty.tests.wip = function() {
					fifty.tests.cli.Call();
				}
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace cli {
		type OptionParser<T> = <O extends object,N extends string>(c: { longname: N, default?: T })
			=> (i: cli.Invocation<O>)
			=> cli.Invocation<O & { [n in N]: T }>

		export interface Exports {
			option: {
				string: OptionParser<string>
				boolean: OptionParser<boolean>
				number: OptionParser<number>
				pathname: OptionParser<slime.jrunscript.file.Pathname>

				array: <O extends object,N extends keyof any,T>(c: { longname: string, value: (s: string) => T })
					=> (i: cli.Invocation<O>)
					=> cli.Invocation<O & { [n in N]: T[] }>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.cli.option = function() {
					const subject = test.subject;

					var invoked = $api.Function.result(
						{
							options: {},
							arguments: ["--foo", "bar", "--baz", 42]
						},
						$api.Function.pipe(
							subject.cli.option.string({ longname: "foo" }),
							subject.cli.option.number({ longname: "baz" })
						)
					);
					verify(invoked).options.foo.is("bar");
					verify(invoked).options.baz.is(42);

					var trial = function(p: cli.Processor<any,any>, args: string[]) {
						return p({
							options: {},
							arguments: args
						});
					}

					fifty.run(function string() {
						var one = trial(subject.cli.option.string({ longname: "a" }), []);
						var two = trial(subject.cli.option.string({ longname: "a" }), ["--a", "foo"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is("foo");
					});

					//	TODO	number is tested below in defaults, but not on its own

					//	TODO	pathname is not tested explicitly

					fifty.run(function defaults() {
						var noDefault = subject.cli.option.number({ longname: "a" });
						var withDefault = subject.cli.option.number({ longname: "a", default: 2 });

						var one = trial(noDefault, []);
						var two = trial(noDefault, ["--a", "1"]);
						var three = trial(withDefault, []);
						var four = trial(withDefault, ["--a", "1"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is(1);
						fifty.verify(three).options.evaluate.property("a").is(2);
						fifty.verify(four).options.evaluate.property("a").is(1);
					});

					var invocation: cli.Invocation<{ a: string, b: number[], c: string }> = {
						options: {
							a: void(0),
							b: [],
							c: void(0)
						},
						arguments: ["--a", "A", "--b", "1", "--b", "3", "--c", "C"]
					};
					fifty.verify(invocation).options.b.length.is(0);
					var processor: cli.Processor<{ a: string, b: number[], c: string }, { a: string, b: number[], c: string }> = subject.cli.option.array({
						longname: "b",
						value: Number
					});
					var after: cli.Invocation<{ a: string, b: number[], c: string }> = processor(invocation);
					fifty.verify(after).options.b.length.is(2);
					fifty.verify(after).options.b[0].is(1);
					fifty.verify(after).options.b[1].is(3);
					fifty.verify(after).arguments[0].is("--a");
					fifty.verify(after).arguments[1].is("A");
					fifty.verify(after).arguments[2].is("--c");
					fifty.verify(after).arguments[3].is("C");

					fifty.run(function harvestedFromWf() {
						fifty.run(
							function() {
								var invocation = {
									options: {},
									arguments: ["--foo", "bar"]
								};
								subject.cli.option.string({
									longname: "baz"
								})(invocation);
								verify(invocation).options.evaluate.property("foo").is(void(0));
								verify(invocation).arguments.length.is(2);
							}
						);

						fifty.run(
				 			function() {
								var invocation = {
									options: {},
									arguments: ["--foo", "bar"]
								};
								subject.cli.option.string({
									longname: "foo"
								})(invocation);
								verify(invocation).options.evaluate.property("foo").is("bar");
								verify(invocation).arguments.length.is(0);
							}
						);

						fifty.run(
				 			function() {
								var invocation = {
									options: {
										baz: false
									},
									arguments: ["--baz", "--bizzy"]
								};
								subject.cli.option.boolean({
									longname: "baz"
								})(invocation);
								verify(invocation).options.baz.is(true);
								verify(invocation).options.evaluate.property("bizzy").is(void(0));
								verify(invocation).arguments.length.is(1);
								verify(invocation).arguments[0].is("--bizzy");
							}
						);

						fifty.run(
				 			function() {
								var processor = $api.Function.pipe(
									subject.cli.option.string({ longname: "a" }),
									subject.cli.option.boolean({ longname: "b" }),
									subject.cli.option.string({ longname: "aa" }),
									subject.cli.option.boolean({ longname: "bb" })
								)
								var invocation = processor({
									options: {},
									arguments: ["--a", "aaa", "--b", "--c", "c"]
								});
								verify(invocation).arguments.length.is(2);
								verify(invocation).arguments[0] == "--c";
								verify(invocation).arguments[1] == "c";
								verify(invocation).options.a.is("aaa");
								verify(invocation).options.b.is(true);
								verify(invocation).options.evaluate.property("aa").is(void(0));
								verify(invocation).options.evaluate.property("bb").is(void(0));
							}
						)
					})
				};
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace cli {
		export namespace error {
			export type NoTargetProvided = $api.error.Instance<"NoTargetProvided",{}>
			export type TargetNotFound = $api.error.Instance<"TargetNotFound", { command: string }>
			export type TargetNotFunction = $api.error.Instance<"TargetNotFunction", { command: string, target: any }>
		}

		export interface Exports {
			error: {
				NoTargetProvided: $api.error.Type<"NoTargetProvided",{}>
				TargetNotFound: $api.error.Type<"TargetNotFound", { command: string }>
				TargetNotFunction: $api.error.Type<"TargetNotFunction", { command: string, target: any }>
			}

			parser: {
				pathname: (argument: string) => slime.jrunscript.file.Pathname
			}

			/**
			 * Parses the `jsh` shell's arguments using the given {@link Processor}, returning the result of the processing.
			 */
			invocation: <T,R>(processor: cli.Processor<T,R>) => cli.Invocation<R>

			run: (command: slime.jsh.script.cli.Command<{}>) => never

			//	TODO	harvest the below documentation if it has useful writing
			// /**
			//  * Given a {@link Descriptor} implementing the application's global options and commands, returns an object capable of
			//  * invoking a {@link Command} with an appropriate {@link Invocation}. Options provided by the `Descriptor` will be processed into
			//  * an `Invocation`,
			//  * and the first remaining argument will be interpreted as a command name. If the command name exists and is a function,
			//  * it will be invoked with the {@link Invocation}.
			//  */
			// Application: (p: cli.Descriptor<any>) => cli.Application

			/**
			 * Executes the program with the given descriptor inside this shell, with the arguments of the shell, and exits the
			 * shell with the exit status indicated by the {@link Command}. If the `Command` returns a numeric exit status, it is
			 * used; otherwise, finishing execution successfully exits with 0 exit status and an uncaught exception exits with
			 * status 1.
			 */
			wrap: (descriptor: cli.Descriptor<any>) => void
		}

		export type Program = (invocation: slime.jsh.script.cli.Invocation<{}>) => number | void

		/**
		 * @experimental
		 *
		 * A value of this type is provided to the top-level `jsh` script's scope as `main`. It can be used to essentially declare
		 * a main function of type {@link Program}, which can be created using functional techniques.
		 */
		export type main = (program: Program) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.cli.invocation = function() {
				const subject = test.subject;

				var parser = fifty.global.$api.Function.pipe(
					subject.cli.option.string({ longname: "foo" })
				);
				var was = fifty.global.jsh.unit.$slime;
				var mocked = fifty.jsh.plugin.mock({
					jsh: fifty.global.jsh,
					$slime: Object.assign({}, was, {
						getPackaged: function() { return null; },
						/** @return { slime.jrunscript.native.inonit.script.jsh.Shell.Invocation } */
						getInvocation: function() {
							return {
								getScript: function() {
									return was.getInvocation().getScript();
								},
								getArguments: function() {
									return ["--foo", "bar"]
								}
							};
						}
					})
				});
				var result: { options: { foo: string }, arguments: string[] } = mocked.jsh.script.cli.invocation(parser);
				fifty.verify(result).options.foo.is("bar");
				fifty.verify(result).arguments.length.is(0);
			};

			fifty.tests.cli.run = function() {
				const $api = fifty.global.$api;
				const subject = test.subject;

				var was: cli.Invocation<any>;
				var invocationWas = function(invocation: cli.Invocation<any>) {
					was = invocation;
				}
				var call = subject.cli.Call.get({
					descriptor: {
						options: subject.cli.option.string({ longname: "global" }),
						commands: {
							universe: $api.Function.pipe(
								subject.cli.option.string({ longname: "command" }),
								function(invocation) {
									invocationWas(invocation);
									return 42;
								}
							)
						}
					},
					arguments: ["--global", "foo", "universe", "--command", "bar"]
				}) as cli.Call<{}>;
				fifty.verify(call).command(call.invocation).evaluate(function(n) { return n as number; }).is(42);
				fifty.verify(was).options.evaluate.property("global").is("foo");
				fifty.verify(was).options.evaluate.property("command").is("bar");

				fifty.run(
					function() {
						var call = subject.cli.Call.get({
							descriptor: {
								commands: {
									foo: function nothing(){}
								}
							},
							arguments: ["foo"]
						}) as cli.Call<{}>;
						fifty.verify(call).command(call.invocation).is.type("undefined");
					}
				);

				fifty.run(
					function() {
						var call = subject.cli.Call.get({
							descriptor: {
								commands: {
									foo: function error() {
										throw new Error();
									}
								}
							},
							arguments: ["foo"]
						}) as cli.Call<{}>;
						fifty.verify(call).evaluate(function(call) { return call.command(call.invocation); }).threw.type(Error);
					}
				);
			};

			fifty.tests.cli.wrap = function() {
				const $api = fifty.global.$api;
				var result: { status: number } = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: ["status"],
					evaluate: $api.Function.identity
				});
				fifty.verify(result).status.is(0);

				result = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: ["status", "42"],
					evaluate: $api.Function.identity
				});
				fifty.verify(result).status.is(42);

				result = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: [],
					evaluate: $api.Function.identity
				});
				fifty.verify(result).status.is(1);
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		arguments: string[]
		getopts: Function & { UNEXPECTED_OPTION_PARSER: any, ARRAY: any, parser: { Pathname: (s: string) => slime.jrunscript.file.Pathname } }
		file?: slime.jrunscript.file.File
		script?: any
		/** @deprecated */
		pathname: any
		/** @deprecated */
		url?: any
		/** @deprecated */
		addClasses: any
		getRelativePath: any
		Application: any
		loader: slime.Loader
		Loader?: any
		world: {
			file: slime.jrunscript.file.world.Location
		}
	}
}

namespace slime.jsh.script.internal {
	export interface Source {
		file: slime.jrunscript.file.File
		uri: string
		packaged: {
			file: slime.jrunscript.file.File
			loader: slime.jrunscript.runtime.Loader
		}
	}

	export interface Context extends Source {
		api: {
			js: any
			web: slime.web.Exports
			file: slime.jrunscript.file.Exports
			http: () => slime.jsh.Global["http"]
			addClasses: (pathname: slime.jrunscript.file.Pathname) => void
			parser: slime.jsh.script.Exports["cli"]["parser"]
		}
		directory: slime.jrunscript.file.Directory
		arguments: string[]
	}
}
