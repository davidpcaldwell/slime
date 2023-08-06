//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell {
	export namespace internal {
		export interface Context {
			exit: any
			stdio: any
			_getSystemProperties: () => slime.jrunscript.native.java.util.Properties

			/**
			 * Provides access to the shell's subshell implementation, allowing a new shell to be invoked within the same process.
			 */
			jsh: (configuration: slime.jrunscript.native.inonit.script.jsh.Shell.Environment, script: slime.jrunscript.file.File, arguments: string[]) => number

			api: {
				js: any
				java: slime.jrunscript.host.Exports
				io: slime.jrunscript.io.Exports
				file: slime.jrunscript.file.Exports
				script: jsh.script.Exports
			}

			module: slime.jrunscript.shell.Exports
		}

		export type Exports = Omit<slime.jsh.shell.Exports,"tools">

		export type Script = slime.loader.Script<Context,slime.jsh.shell.Exports>
	}

	export type Echo = (message: string, mode?: { console?: (message: string) => void, stream?: any }) => void

	/**
	 * An implementation of {@link slime.jrunscript.shell.Exports} that adds additional APIs that are available when running under
	 * the `jsh` shell.
	 */
	export interface Exports {}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface JshShellJsh {
	}

	export interface Exports {
		jsh: JshShellJsh
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.jsh = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface UnbuiltInstallation {
		src: string
	}

	export interface BuiltInstallation {
		home: string
	}

	export interface PackagedInstallation {
		package: string
	}

	export interface UrlInstallation {
		url: string
	}

	export type Installation = UnbuiltInstallation | BuiltInstallation | PackagedInstallation | UrlInstallation

	export type Intention = (
		{
			shell: Installation,
			script: string
		}
		& Pick<slime.jrunscript.shell.run.Intention,"arguments" | "environment" | "stdio" | "directory">
	)

	export interface JshShellJsh {
		Installation: {
			from: {
				/**
				 * @experimental
				 *
				 * Returns the `jsh` installation that is running the current shell. Only implemented for unbuilt shells currently.
				 */
				current: slime.$api.fp.impure.Input<Installation>
			}
		}

		Intention: {
			toShellIntention: (p: Intention) => slime.jrunscript.shell.run.Intention
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const fixtures = (function() {
				var script: slime.jrunscript.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
				return script();
			})();

			fifty.tests.exports.jsh.Installation = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from.current = fifty.test.Parent();

			var getInstallationFromDiagnosticOutput: (data: any) => slime.jsh.shell.Installation = $api.fp.property("installation");

			var getInstallationFromIntention = $api.fp.pipe(
				jsh.shell.jsh.Intention.toShellIntention,
				$api.fp.world.mapping(jsh.shell.subprocess.question),
				function(result) {
					if (result.status != 0) throw new Error("Status: " + result.status);
					return result.stdio.output;
				},
				JSON.parse,
				getInstallationFromDiagnosticOutput
			);

			var getDiagnosticScriptForShellAt = $api.fp.pipe(
				jsh.file.Location.from.os,
				jsh.file.Location.directory.relativePath("jrunscript/jsh/test/jsh-data.jsh.js"),
				$api.fp.property("pathname")
			);

			fifty.tests.exports.jsh.Installation.from.current.unbuilt = function() {
				var cast: slime.js.Cast<UnbuiltInstallation> = $api.fp.cast;

				var shell = fixtures.shells.unbuilt();

				var intention: slime.jsh.shell.Intention = {
					shell: shell,
					script: getDiagnosticScriptForShellAt(shell.src),
					stdio: {
						output: "string"
					}
				};

				var installation = getInstallationFromIntention(intention);

				verify(installation).evaluate(cast).src.is(shell.src);
			};

			fifty.tests.exports.jsh.Installation.from.current.built = function() {
				var cast: slime.js.Cast<BuiltInstallation> = $api.fp.cast;

				var shell = fixtures.shells.built();

				var intention: slime.jsh.shell.Intention = {
					shell: shell,
					script: getDiagnosticScriptForShellAt(jsh.shell.jsh.src.pathname.toString()),
					stdio: {
						output: "string"
					}
				};

				var installation = getInstallationFromIntention(intention);

				verify(installation).evaluate(cast).home.is(shell.home);
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.Intention = {};
			fifty.tests.Intention.jsh = function() {
				var intention = jsh.shell.jsh.Intention.toShellIntention({
					shell: {
						src: jsh.shell.jsh.src.toString()
					},
					script: fifty.jsh.file.relative("../../jsh/test/jsh-data.jsh.js").pathname,
					stdio: {
						output: "string"
					}
				});
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					intention
				);
				jsh.shell.console(JSON.stringify(JSON.parse(result.stdio.output), void(0), 4));
			}
		}
	//@ts-ignore
	)(fifty);

	type Argument = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node | slime.jrunscript.file.File | slime.jrunscript.file.Directory

	export namespace oo {
		export interface EngineResult {
			status: number
			jsh: {
				script: Invocation["script"]
				arguments: Invocation["arguments"]
			}
			environment: Invocation["environment"]
			directory: Invocation["directory"]
			workingDirectory: Invocation["workingDirectory"]
		}

		// export interface ForkResult extends EngineResult {
		// 	//	TODO	Plenty of working code indicates this property is present, but so far, analysis of the code has not revealed
		// 	//			why that might be
		// 	//
		// 	//	TODO	Now it looks like only forked shells would have this, which makes sense. Not sure whether it could be
		// 	//			correctly implemented for internal subshells; would have to think hard about java.lang.System streams
		// 	//			etc. and make sure everything was strictly encapsulated.
		// 	stdio: Invocation["stdio"]
		// }
		export type ForkResult = slime.jrunscript.shell.run.old.Result

		export type Result = ForkResult | EngineResult

		export interface Invocation {
			script: slime.jrunscript.file.File
			arguments?: Argument[]
			environment?: any
			stdio?: any
			directory?: any
			workingDirectory?: any
			properties?: { [x: string]: string }

			on?: slime.jrunscript.shell.run.old.Argument["on"]
		}

		export interface EngineInvocation<R = EngineResult> extends Invocation {
			fork?: false
			evaluate?: (p: EngineResult) => R
		}

		export interface ForkInvocation<R = ForkResult> extends Invocation {
			shell?: slime.jrunscript.file.Directory
			fork?: true
			vmarguments?: any

			evaluate?: (p: ForkResult) => R
		}
	}

	export interface JshShellJsh {
		<R>(p: oo.ForkInvocation<R>): R
		<R>(p: oo.EngineInvocation<R>): R

		src?: slime.jrunscript.file.Directory

		require: slime.$api.fp.world.Action<{
				satisfied: () => boolean,
				install: () => void
			}, {
				installing: void
				installed: void
				satisfied: void
			}
		>

		lib?: slime.jrunscript.file.Directory
		home?: slime.jrunscript.file.Directory
		relaunch: (p?: {
			environment?: (initial: slime.jrunscript.shell.Exports["environment"]) => slime.jrunscript.shell.Exports["environment"]
		}) => void
		debug: any
		url: any
	}

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * The JavaScript engine executing the loader process for the shell, e.g., `rhino`, `nashorn`.
		 */
		engine: string

		//	TODO	run.evaluate.wrap is exported but not declared here (unused?)

		exit: (code: number) => never

		/**
		 * The standard I/O streams for this shell.
		 */
		stdio: {
			//	TODO	originally this supported methods of Reader also, should it?
			input: slime.jrunscript.runtime.io.InputStream
			output: slime.jrunscript.shell.context.Console
			error: slime.jrunscript.shell.context.Console
		}

		/** @deprecated Use {@link Exports["stdio"]["input"]} */
		stdin: Exports["stdio"]["input"]
		/** @deprecated Use {@link Exports["stdio"]["output"]} */
		stdout: Exports["stdio"]["output"]
		/** @deprecated Use {@link Exports["stdio"]["error"]} */
		stderr: Exports["stdio"]["error"]

		echo: Echo & {
			String: (message: any) => string & {
				undefined: string
				null: string
			}
		}

		console: (message: string) => void

		//	TODO	shell?
		rhino: {
			classpath: slime.jrunscript.file.Searchpath
		}

		/** @deprecated Replaced by `run`. */
		shell: any

		jsh: JshShellJsh

		run: slime.jrunscript.shell.Exports["run"] & {
			evaluate: {
				wrap: any
				jsh: {
					wrap: any
				}
			}
		}

		world: slime.jrunscript.shell.Exports["world"] & {
			exit: slime.$api.fp.world.old.Action<number,void>
		}

		HOME: slime.jrunscript.file.Directory
		PATH: slime.jrunscript.file.Searchpath
		listeners: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);
}
