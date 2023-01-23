//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		shell: slime.jsh.shell.Exports
	}
}

namespace slime.jsh.shell {
	export namespace internal {
		export interface Context {
			exit: any
			stdio: any
			_getSystemProperties: () => slime.jrunscript.native.java.util.Properties

			/**
			 * Provides access to the shell's subshell implementation, allowing a new shell to be invoked within the same process.
			 */
			jsh: any

			api: {
				js: any
				java: slime.jrunscript.host.Exports
				io: slime.jrunscript.io.Exports
				file: slime.jrunscript.file.Exports
				script: jsh.script.Exports
			}
		}
	}

	type Argument = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node | slime.jrunscript.file.File | slime.jrunscript.file.Directory

	export type Echo = (message: string, mode?: { console?: (message: string) => void, stream?: any }) => void

	/**
	 * An implementation of {@link slime.jrunscript.shell.Exports} that adds additional APIs that are available when running under
	 * the `jsh` shell.
	 */
	export interface Exports {}

	export type Intention = (
		{
			shell: {
				src: string
			},
			script: string
		}
		& Pick<slime.jrunscript.shell.run.Intention,"arguments" | "environment" | "stdio" | "directory">
	)

	export interface Exports {
		Intention: slime.jrunscript.shell.Exports["Intention"] & {
			jsh: (p: Intention) => slime.jrunscript.shell.run.Intention
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.Intention = {};
			fifty.tests.Intention.jsh = function() {
				var intention = jsh.shell.Intention.jsh({
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

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * The JavaScript engine executing the loader process for the shell, e.g., `rhino`, `nashorn`.
		 */
		engine: string

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

		//	TODO	run.evaluate.wrap
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
		rhino: any
		shell: any
		jsh: {
			(p: {
				shell?: slime.jrunscript.file.Directory
				script: slime.jrunscript.file.File
				fork?: boolean
				evaluate?: (p: any) => any
				arguments?: Argument[]
				environment?: any
				stdio?: any
				directory?: any
				workingDirectory?: any
				properties?: { [x: string]: string }
				on?: slime.jrunscript.shell.run.old.Argument["on"]
			}): any
			src?: slime.jrunscript.file.Directory
			require: (p: { satisfied: () => boolean, install: () => void }, events?: $api.event.Function.Receiver ) => void
			lib?: slime.jrunscript.file.Directory
			home?: slime.jrunscript.file.Directory
			relaunch: () => void
			debug: any
			command: any
			url: any
		}
		HOME: slime.jrunscript.file.Directory
		PATH: slime.jrunscript.file.Searchpath
		listeners: any
		tools: jsh.shell.tools.Exports
	}
}
