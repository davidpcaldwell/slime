namespace slime.jsh.script {
	interface Invocation<T> {
		options: T
		arguments: string[]
	}

	interface Processor<T> {
		(invocation: Invocation<T>): Invocation<T>
	}

	/**
	 * A process that may return a numeric exit status that can be used as a process exit status, or may complete normally, or
	 * may throw an uncaught exception.
	 */
	export interface Command<T> {
		(invocation: Invocation<T>): number | void
	}

	export interface Commands {
		[x: string]: Commands | Command<any>
	}

	interface Application {
		run: (args: string[]) => number
	}

	interface Descriptor {
		options?: <G>(invocation: Invocation<G>) => Invocation<G>
		commands: Commands
	}

	/**
	 * Represents the module inside the Fifty test suite.
	 */
	const subject: Exports = (function(fifty) {
		const jsh = fifty.global.jsh;
		const subject = jsh.script;
		return subject;
	//@ts-ignore
	})(fifty);

	export interface Exports {
		cli: {
			parser: {
				pathname: (argument: string) => slime.jrunscript.file.Pathname
			}

			option: {
				string: (c: { longname: string, default?: string }) => Processor<any>
				boolean: (c: { longname: string }) => Processor<any>
				number: (c: { longname: string, default?: number }) => Processor<any>
				pathname: (c: { longname: string, default?: slime.jrunscript.file.Pathname }) => Processor<any>
				array: (c: { longname: string, value: (s: string) => any }) => Processor<any>
			}

			/**
			 * Parses the `jsh` shell's arguments using the given {@link Processor}, returning the result of the processing.
			 */
			invocation: (processor: Processor<any>) => Invocation<any>

			/**
			 * Given a {@link Descriptor} implementing the application's global options and commands, returns an object capable of
			 * invoking a {@link Command} with an appropriate {@link Invocation}. Options provided by the `Descriptor` will be processed into
			 * an `Invocation`,
			 * and the first remaining argument will be interpreted as a command name. If the command name exists and is a function,
			 * it will be invoked with the {@link Invocation}.
			 */
			Application: (p: Descriptor) => Application

			/**
			 * Executes the program with the given descriptor inside this shell, with the arguments of the shell, and exits the
			 * shell with the exit status indicated by the {@link Command}. If the `Command` returns a numeric exit status, it is
			 * used; otherwise, finishing execution successfully exits with 0 exit status and an uncaught exception exits with
			 * status 1.
			 */
			wrap: (descriptor: Descriptor) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.cli = {
				option: function() {
					var trial = function(p: Processor<any>, args: string[]) {
						return p({
							options: {},
							arguments: args
						});
					}

					run(function string() {
						var one = trial(subject.cli.option.string({ longname: "a" }), []);
						var two = trial(subject.cli.option.string({ longname: "a" }), ["--a", "foo"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is("foo");
					});

					//	TODO	number is tested below in defaults, but not on its own

					//	TODO	pathname is not tested explicitly

					run(function defaults() {
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

					var invocation: Invocation<{ a: string, b: number[], c: string }> = {
						options: {
							a: void(0),
							b: [],
							c: void(0)
						},
						arguments: ["--a", "A", "--b", "1", "--b", "3", "--c", "C"]
					};
					fifty.verify(invocation).options.b.length.is(0);
					var after: Invocation<{ a: string, b: number[], c: string }> = subject.cli.option.array({
						longname: "b",
						value: Number
					})(invocation);
					fifty.verify(after).options.b.length.is(2);
					fifty.verify(after).options.b[0].is(1);
					fifty.verify(after).options.b[1].is(3);
					fifty.verify(after).arguments[0].is("--a");
					fifty.verify(after).arguments[1].is("A");
					fifty.verify(after).arguments[2].is("--c");
					fifty.verify(after).arguments[3].is("C");
				},
				invocation: function() {
					var parser = fifty.$api.Function.pipe(
						subject.cli.option.string({ longname: "foo" })
					);
					var was = fifty.global.jsh.unit.$slime;
					var mocked = fifty.$loader.jsh.plugin.mock({
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
				},
				run: function() {
					const $api = fifty.$api;
					var was: Invocation<any>;
					var invocationWas = function(invocation: Invocation<any>) {
						was = invocation;
					}
					fifty.verify(subject).cli.Application({
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
					}).run(["--global", "foo", "universe", "--command", "bar"]).is(42);
					fifty.verify(was).options.evaluate.property("global").is("foo");
					fifty.verify(was).options.evaluate.property("command").is("bar");

					fifty.verify(subject).cli.Application({
						commands: {
							foo: function nothing(){}
						}
					}).run(["foo"]).is(0);

					fifty.verify(subject).cli.Application({
						commands: {
							foo: function error() {
								throw new Error();
							}
						}
					}).run(["foo"]).is(1);
				},
				wrap: function() {
					const $api = fifty.$api;
					var result: { status: number } = fifty.global.jsh.shell.jsh({
						shell: fifty.global.jsh.shell.jsh.src,
						script: fifty.$loader.getRelativePath("test/cli.jsh.js").file,
						arguments: ["status"],
						evaluate: $api.Function.identity
					});
					fifty.verify(result).status.is(0);

					result = fifty.global.jsh.shell.jsh({
						shell: fifty.global.jsh.shell.jsh.src,
						script: fifty.$loader.getRelativePath("test/cli.jsh.js").file,
						arguments: ["status", "42"],
						evaluate: $api.Function.identity
					});
					fifty.verify(result).status.is(42);

					result = fifty.global.jsh.shell.jsh({
						shell: fifty.global.jsh.shell.jsh.src,
						script: fifty.$loader.getRelativePath("test/cli.jsh.js").file,
						arguments: [],
						evaluate: $api.Function.identity
					});
					fifty.verify(result).status.is(1);
				}
			};

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli.option);
				fifty.run(fifty.tests.cli.invocation);
				fifty.run(fifty.tests.cli.run);
				fifty.run(fifty.tests.cli.wrap);
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
	}
}