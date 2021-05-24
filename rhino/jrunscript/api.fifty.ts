//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jrunscript.bootstrap {
	export interface Configuration {
		script: {
			file: string
			url: string
		}
		arguments: string[]
	}

	interface Script {
		load: () => void
		file?: slime.jrunscript.native.java.io.File
		url?: slime.jrunscript.native.java.net.URL
		resolve: (path: string) => Script
	}

	export interface Global<T,J> {
		load: any
		Packages: slime.jrunscript.Packages
		JavaAdapter: any
		readFile: any
		readUrl: any

		//	Used in jsh/launcher/main.js
		Java: any

		$api: {
			debug: any
			console: any
			log: any
			engine: any

			Script: {
				new (p: { string: string }): Script
				new (p: { file: slime.jrunscript.native.java.io.File }): Script
				new (p: { url: slime.jrunscript.native.java.net.URL }): Script

				run: (p: any) => void
			}
			script: any
			arguments: string[]

			java: {
				Install: any
				install: any
				getClass: any
				Array: any
				Command: any
			} & J

			io: {
				tmpdir: (p?: { prefix?: string, suffix?: string }) => slime.jrunscript.native.java.io.File
				copy: any
				unzip: any
			}

			bitbucket: any

			rhino: any
			shell: any
		} & T
	}
}