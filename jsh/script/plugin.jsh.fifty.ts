namespace jsh.script {
	interface Invocation<T> {
		options: T
		arguments: string[]
	}

	interface Command<T> {
		(invocation: Invocation<T>): number
	}

	interface Commands {
		[x: string]: Commands | Command<any>
	}

	export interface Exports {
		cli: {
			run: (commands: Commands, arguments: string[]) => number
		}
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				const jsh = fifty.global.jsh;
				const subject = jsh.script;
				jsh.shell.console("subject keys = " + Object.keys(jsh.script));
				fifty.verify(subject).cli.run({}, []).is(0);
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