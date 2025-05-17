//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	export interface Build {
		destination: {
			directory?: slime.jrunscript.file.Directory

			//	TODO	using 'any' right now because don't feel like analyzing deprecated rhino/file/zip.js
			war?: any
		}

		rhino: boolean

		libraries?: {
			[x: string]: {
				copy(pathname: slime.jrunscript.file.Pathname, mode: { recursive: boolean })
			}
		}

		java?: {
			version?: string
		}

		compile?: slime.jrunscript.file.File[]

		parameters: {
			[x: string]: string
		}

		servlet: string

		Resources: (this: slime.jsh.httpd.Resources) => void
	}

	export interface Exports {
		//	TODO	based on old TODO comment, there is probably no test for creating a `.war` and then running it to make sure it
		//			works
		/**
		 * 	A module allowing for, among other things, servlet applications to be compiled into <code>.war</code> files.
		 */
		tools: {
			getJavaSourceFiles: (p: slime.jrunscript.file.Pathname) => slime.jrunscript.file.File[]

			build: slime.$api.fp.impure.Effect<Build>

			proxy: slime.servlet.proxy.Exports
		}
	}
}
