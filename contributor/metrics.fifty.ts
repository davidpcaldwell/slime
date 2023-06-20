//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.metrics {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			code: slime.tools.code.Exports
		}
	}

	export interface SourceFile {
		path: string
		file: slime.jrunscript.file.File
	}

	export interface Exports {
		/**
		 * Returns all the source files under the given directory. Source files are defined as all files in a directory containing
		 * source files; the `.git`, `local`, and `bin` directories are excluded, as are `.git` files.
		 */
		getSourceFiles: (base: slime.jrunscript.file.Directory) => SourceFile[]

		SourceFile: {
			isJsapi: slime.$api.fp.Predicate<SourceFile>
			isGenerated: slime.$api.fp.Predicate<SourceFile>
			isJavascript: slime.$api.fp.Predicate<SourceFile>
			isTypescript: slime.$api.fp.Predicate<SourceFile>

			javascript: {
				hasTypeChecking: (sourceFile: SourceFile) => slime.$api.fp.Maybe<boolean>
			}
		}
	}

	export type Script = slime.loader.Script<Context,Exports>
}
