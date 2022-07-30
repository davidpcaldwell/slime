//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export interface Context {
	}

	export interface Exports {
	}

	export namespace test {
		export interface Result {
			src: string
			home: string
			logging: string
			foo1: string
			foo2: string
			tmp: string
			rhino: {
				running: boolean
				optimization: number
				classpath: string
			}
		}

		export interface ShellInvocation {
			vmarguments?: slime.jrunscript.shell.invocation.Token[]
			bash?: string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Directory
			logging?: string
			properties?: { [name: string]: string }
			shell?: slime.jrunscript.shell.invocation.Token[]
			script?: slime.jrunscript.file.File
			arguments?: slime.jrunscript.shell.invocation.Token[]
			environment: { [name: string]: string }
			stdio?: slime.jrunscript.shell.invocation.old.Stdio
			evaluate?: any
		}

		export interface ShellInvocationEvents {
			invocation: {
				command: string
				arguments: string[]
				environment: { [x: string]: string }
			}
			output: string
		}

		export interface ShellImplementation {
			type: "unbuilt" | "built"
			shell: slime.jrunscript.shell.invocation.Token[]
			coffeescript: slime.jrunscript.file.File
		}

		/**
		 * Describes the shell sufficiently that the correct output of the test script can be predicted.
		 */
		export interface ShellDescriptor {
			hasRhino: boolean
			isRhino: boolean
			isUnbuilt: boolean
			tmp: slime.jrunscript.file.Directory
		}

		export interface ShellContext {
			/**
			 * The file representing the main script; at the moment, the JSAPI test suite.
			 */
			 main: slime.jrunscript.file.File

			 /**
			  * If running in an unbuilt shell, its location.
			  */
			 src: slime.jrunscript.file.Directory

			 /**
			  * If running in a built shell, its location.
			  */
			 home: slime.jrunscript.file.Directory
		}

		export interface BuiltShellContext extends ShellContext {
			/**
			 * The specified location of the built shell, if any.
			 */
			specified: slime.jrunscript.file.Pathname
		}

		export interface BuiltShellEvents {
			specified: slime.jrunscript.file.Pathname
			current: slime.jrunscript.file.Directory
			buildStart: void
			buildLocation: slime.jrunscript.file.Directory
			buildOutput: string
		}

		export interface Scenario {
			name: string
			execute: (verify: slime.definition.verify.Verify) => void
		}

		export type Checks = (result: Result) => (verify: slime.definition.verify.Verify) => void

		export interface Context {
			library: {
				shell: slime.jrunscript.shell.Exports
			}
			script: slime.jrunscript.file.File
			console: (message: string) => void
		}

		export interface Exports {
			Context: {
				from: {
					jsh: (jsh: slime.jsh.Global) => ShellContext
				}
				src: (context: ShellContext) => slime.jrunscript.file.Directory
			}

			getEngines: (src: slime.jrunscript.file.Directory) => string[]

			requireBuiltShellHomeDirectory: slime.$api.fp.world.Question<
				slime.jsh.internal.launcher.test.BuiltShellContext,
				slime.jsh.internal.launcher.test.BuiltShellEvents,
				slime.jrunscript.file.Directory
			>

			getBuiltShellHomeDirectory: (p: {
				context: ShellContext
				built: slime.jrunscript.file.Pathname
				console: (message: string) => void
			}) => slime.jrunscript.file.Directory

			toScenario: (
				rhinoLocation: slime.jrunscript.file.Pathname,
				builtShell: slime.jrunscript.file.Directory,
				tmp: slime.jrunscript.file.Directory
			) => (engine: string, implementation: ShellImplementation) => Scenario
		}

		export type Script = slime.loader.Script<Context,Exports>
	}

	// (
	// 	function($export: slime.loader.Export<Exports>) {
	// 		var fifty: slime.fifty.test.Kit = null;
	// 		var verify = fifty.verify;
	// 	}
	// )

	// (
	// 	function(
	// 		fifty: slime.fifty.test.Kit
	// 	) {
	// 		fifty.tests.suite = function() {

	// 		}
	// 	}
	// //@ts-ignore
	// )(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
