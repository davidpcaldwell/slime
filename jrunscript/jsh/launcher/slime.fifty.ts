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

	export namespace settings {
		/**
		 * Defines how a particular setting (which is denoted by a Java system property, although it can also be set via
		 * environment variable) is used by the launcher.
		 */
		export interface Definition {
			/**
			 * If `true`, this setting is available within the launcher.
			 */
			launcher: boolean

			/**
			 * If `true`, this setting is passed as a system property to the loader VM.
			 */
			loader: boolean

			/**
			 * If present, this setting adds VM arguments to the loader VM; this function is invoked with the setting's current
			 * value, and should return an array of strings representing VM arguments.
			 */
			loaderVmArguments?: (value: string) => string[]
		}

		export interface Setting {
			set: (value: string) => void
			default: (f: () => string) => void

			/**
			 * Returns the effective value for a given setting in the context of the launcher process.
			 */
			getLauncherProperty: () => string

			loaderVmArguments: () => string[]
			getLoaderProperty: () => string
		}
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

		settings: {
			byName: (name: string) => settings.Setting

			//	Probably redundant but currently appears to be used in packaged shells, where applyTo does not apply in the same
			//	way given that there is no loader VM.
			sendPropertiesTo: (recipient: slime.internal.jrunscript.bootstrap.java.Command) => void

			applyTo: (recipient: slime.internal.jrunscript.bootstrap.java.Command) => void
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
