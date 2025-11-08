//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	//	would like to use namespace slime but that conflicts with same name of top-level namespace
	export interface SlimeConfiguration {
		built?: slime.jrunscript.native.java.io.File
	}

	export interface Source {
		getSourceFilesUnder: {
			(string: string): slime.jrunscript.native.java.net.URL[]
			(dir: slime.jrunscript.native.java.io.File): slime.jrunscript.native.java.io.File[]
		}

		/**
		 * (conditional; if underlying source root is a directory rather than a URL)
		 */
		File?: (path: string) => slime.jrunscript.native.java.io.File

		//	TODO	poaaibly equivalent to File
		/**
		 * (conditional; if underlying source root is a directory rather than a URL)
		 */
		getFile?: (path: string) => slime.jrunscript.native.java.io.File

		getPath: (path: string) => string
	}

	export interface Slime {
		launcher: {
			getClasses: any
			compile: any
		}

		home: any

		/**
		 * Returns a string representing the explicit value of a named setting (for example, `foo.bar.baz`); uses first system
		 * properties and then environment variables (for example, `FOO_BAR_BAZ`) to locate the value.
		 *
		 * @param name The period-delimited name of a setting.
		 *
		 * @returns The string value of the setting, or `null` if the setting was not explicitly provided.
		 */
		setting: (name: string) => string

		settings: {
			/**
			 * Returns the effective value for a given setting.
			 */
			get: (name: string) => string
			set: (name: string, value: string) => void
			default: (name: string, value: string | (() => string)) => void

			getContainerArguments: any
			sendPropertiesTo: any
		}

		Src: (p: {
			file?: slime.jrunscript.native.java.io.File
			url?: slime.jrunscript.native.java.net.URL
			resolve: (path: string) => Pick<slime.internal.jrunscript.bootstrap.Script,"toString"|"file">
		}) => Source

		/**
		 * (conditional; if this is an unbuilt local or remote shell)
		 */
		src?: Source
	}
}
