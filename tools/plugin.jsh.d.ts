interface jsh {
	wf: jsh.wf.Exports
}

namespace jsh.wf {
	namespace Exports.requireGitIdentity {
		interface get {
			name: (p: { repository: slime.jrunscript.git.Repository.Local }) => string,
			email: (p: { repository: slime.jrunscript.git.Repository.Local }) => string
		}
	}

	interface Context {
		base: slime.jrunscript.file.Directory
	}

	interface Invocation {
		options: { [x: string]: any },
		arguments: string[],
		[x: string]: any
	}

	type Mutator<T> = <T>(t: T) => void

	namespace cli {
		interface Arguments {
			options: { [x: string]: any },
			arguments: string[]
		}

		interface Command {
			(p: Arguments): void
		}
	}

	interface Exports {
		$f: {
			option: {
				string: (c: { longname: string }) => (p: Invocation) => void
				boolean: (c: { longname: string }) => (p: Invocation) => void
			}
		}

		cli: {
			initialize(
				context: jsh.wf.Context,
				$exports: {
					tsc: jsh.wf.cli.Command
					submodule: {
						status: jsh.wf.cli.Command
					}
				}
			)
		}

		invocation: (mutator: Mutator<Invocation>) => Invocation

		project: {
			base: slime.jrunscript.file.Directory
			submodule: {
				status: () => Array<{
					path: string
					branch: slime.jrunscript.git.Branch
					state: ReturnType<ReturnType<Exports["git"]["compareTo"]>>
				}>
			}
			updateSubmodule: (p: { path: string }) => void
		}

		git: {
			compareTo: (branchName: string) =>
				(repository: slime.jrunscript.git.Repository.Local) => {
					ahead: slime.jrunscript.git.Commit[],
					behind: slime.jrunscript.get.Commit[],
					paths: any
				}
		}

		typescript: {
			tsc: () => void
		}

		requireGitIdentity: ( (p: {
			repository: slime.jrunscript.git.Repository.Local,
			get?: Exports.requireGitIdentity.get
		}, events?: $api.Events.Function.Receiver) => void) & { get: {
			gui: Exports.requireGitIdentity.get
		} }

		prohibitUntrackedFiles: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void

		prohibitModifiedSubmodules: (p: { repository: slime.jrunscript.git.Repository.Local }, events?: $api.Events.Function.Receiver) => void
	}
}

tests.types.Exports = function(module: jsh.wf.Exports,jsh) {
	jsh.shell.console(Object.keys(module));
	(function() {
		var invocation = {
			options: {},
			arguments: ["--foo", "bar"]
		};
		module.$f.option.string({
			longname: "baz"
		})(invocation);
		verify(invocation).options.evaluate.property("foo").is(void(0));
		verify(invocation).arguments.length.is(2);
	})();

	(function() {
		var invocation = {
			options: {},
			arguments: ["--foo", "bar"]
		};
		module.$f.option.string({
			longname: "foo"
		})(invocation);
		verify(invocation).options.evaluate.property("foo").is("bar");
		verify(invocation).arguments.length.is(0);
	})();

	(function() {
		var invocation = {
			options: {},
			arguments: ["--baz", "--bizzy"]
		};
		module.$f.option.boolean({
			longname: "baz"
		})(invocation);
		verify(invocation).options.baz.is(true);
		verify(invocation).options.evaluate.property("bizzy").is(void(0));
		verify(invocation).arguments.length.is(1);
		verify(invocation).arguments[0].is("--bizzy");
	})();

	(function() {
		var invocation = module.invocation(
			//	TODO	should module.$f.option.string("a") work?
			module.$f.option.string({ longname: "a" }),
			module.$f.option.boolean({ longname: "b" }),
			module.$f.option.string({ longname: "aa" }),
			module.$f.option.boolean({ longname: "bb" })
		);
		jsh.shell.console(JSON.stringify(invocation));
		verify(invocation).arguments.length.is(2);
		verify(invocation).arguments[0] == "--c";
		verify(invocation).arguments[1] == "c";
		verify(invocation).options.a.is("aaa");
		verify(invocation).options.b.is(true);
		verify(invocation).options.evaluate.property("aa").is(void(0));
		verify(invocation).options.evaluate.property("bb").is(void(0));
	})();
}

tests.suite = function() {
	var global = (function() { return this; })();
	//	TODO	$loader.plugin.mock() is not provided by standalone Fifty runner
	var plugin = $loader.plugin.mock({
		path: "./",
		global: {},
		jsh: {
			script: {
				arguments: ["--a", "aaa", "--b", "--c", "c"]
			},
			file: jsh.file,
			shell: jsh.shell,
			ui: jsh.ui,
			tools: jsh.tools
		},
		plugins: {},
		evaluate: function(after) {
			global.jsh.shell.console("after = " + Object.keys(after));
			global.jsh.shell.console("after.jsh = " + Object.keys(after.jsh));
			return after.jsh.wf;
		}
	});
	//tests.types.Exports(global.jsh.wf, global.jsh);
	tests.types.Exports(plugin, global.jsh);
}