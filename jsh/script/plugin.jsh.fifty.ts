namespace jsh.script {
	interface Invocation<T> {
		options: T
		arguments: string[]
	}

	interface Processor<T> {
		(invocation: Invocation<T>): Invocation<T>
	}

	export interface Command<T> {
		options: Processor<T>
		command: (invocation: Invocation<T>) => number
	}

	export interface Commands {
		[x: string]: Commands | Command<any>
	}

	interface Application {
		run: (args: string[]) => number
	}

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

			Application: (p: {
				options: <G>(invocation: Invocation<G>) => Invocation<G>
				commands: Commands
			}) => Application
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				var was: Invocation<any>;
				var invocationWas = function(invocation: Invocation<any>) {
					was = invocation;
				}
				fifty.verify(subject).cli.Application({
					options: subject.cli.option.string({ longname: "global" }),
					commands: {
						universe: {
							options: subject.cli.option.string({ longname: "command" }),
							command: function(invocation) {
								invocationWas(invocation);
								return 42;
							}
						}
					}
				}).run(["--global", "foo", "universe", "--command", "bar"]).is(42);
				fifty.verify(was).options.evaluate.property("global").is("foo");
				fifty.verify(was).options.evaluate.property("command").is("bar");
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