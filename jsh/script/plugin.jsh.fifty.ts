namespace slime.jsh.script {
	interface Invocation<T> {
		options: T
		arguments: string[]
	}

	interface Processor<T> {
		(invocation: Invocation<T>): Invocation<T>
	}

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
			option: {
				string: (c: { longname: string }) => Processor<any>
				boolean: (c: { longname: string }) => Processor<any>
				number: (c: { longname: string }) => Processor<any>
				pathname: (c: { longname: string }) => Processor<any>
			},

			Application: (p: Descriptor) => Application

			/**
			 * Executes the program with the given descriptor inside this shell, with the arguments of the shell, and exits the
			 * shell with the exit status returned by the {Command}.
			 */
			wrap: (descriptor: Descriptor) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.cli = {
				run: function() {
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