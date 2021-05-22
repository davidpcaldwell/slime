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
			script: any
			engine: any
			rhino: any
			console: any
			java: {
				Install: any
				install: any
				getClass: any
				Array: any
				Command: any
			} & J
			arguments: string[]
			shell: any
			io: {
				tmpdir: (p?: { prefix?: string, suffix?: string }) => slime.jrunscript.native.java.io.File
				copy: any
				unzip: any
			}
			log: any

			Script: any

			bitbucket: any
		} & T
	}
}