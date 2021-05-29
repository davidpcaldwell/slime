//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jsh.launcher {
	//	would like to use namespace slime but that conflicts with same name of top-level namespace
	export interface SlimeConfiguration {
		built?: slime.jrunscript.native.java.io.File
	}

	export interface Slime {
		launcher: any
		home: any

		/**
		 * Given a system property-style name (e.g., `foo.bar.baz`), searches for a value both in that system property and (if not
		 * found) in a corresponding environment variable (in this case, `FOO_BAR_BAZ`).
		 */
		setting: (name: string) => string

		settings: {
			get: (name: string) => string
			set: (name: string, value: any) => void

			getContainerArguments: any
			sendPropertiesTo: any
		}

		src?: {
			getSourceFilesUnder: (dir: slime.jrunscript.native.java.io.File) => slime.jrunscript.native.java.io.File[]
			File: (path: string) => slime.jrunscript.native.java.io.File
			getPath: (path: string) => string
		}
	}
}