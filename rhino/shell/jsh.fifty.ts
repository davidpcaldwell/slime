//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		shell: slime.jsh.shell.Exports & {
			/** @deprecated */
			getopts: slime.jsh.Global["script"]["getopts"]
		}
	}
}

namespace slime.jsh.shell {
	export namespace internal {
		export interface Context {
			exit: any
			stdio: any
			_getSystemProperties: () => slime.jrunscript.native.java.util.Properties
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
		browser: slime.jrunscript.shell.browser.Exports
		listeners: any
		system: {
			apple: {
				plist: {
					xml: {
						encode: Function
						decode: Function
					}
				}
				osx: {
					ApplicationBundle: any
				}
			}
			opendesktop: any
		},
		tools: jsh.shell.tools.Exports
	}
}
