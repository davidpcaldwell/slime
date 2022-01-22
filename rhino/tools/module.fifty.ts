//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.java.tools {
	export interface Context {
		api: {
			js: {
				constant: any
			}
			java: slime.jrunscript.host.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export interface JavacResult {
		status: number
		arguments: string[]
	}

	export interface Exports {
		javac: {
			/**
			 * @deprecated Use the form that returns the result and pipe that to another function using `$api.Function.pipe` for
			 * this behavior.
			 */
			<R>(p: {
				debug?: boolean
				destination?: slime.jrunscript.file.Pathname
				classpath?: slime.jrunscript.file.Searchpath
				sourcepath?: slime.jrunscript.file.Searchpath
				source?: string
				target?: string
				arguments: any[]
				evaluate: (result: JavacResult) => R
			}): R

			(p: {
				debug?: boolean
				destination?: slime.jrunscript.file.Pathname
				classpath?: slime.jrunscript.file.Searchpath
				sourcepath?: slime.jrunscript.file.Searchpath
				source?: string
				target?: string
				arguments: any[]
			}): JavacResult
		}

		Jar: any
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
