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

	export interface Environment {
		load: any

		//	Rhino compatibility
		Packages: slime.jrunscript.Packages
		JavaAdapter?: any

		//	Rhino-provided
		readFile?: any
		readUrl?: any

		//	Nashorn-provided
		//	Used to provide debug output before Packages is loaded
		//	Used in jsh/launcher/main.js
		Java?: any

		$api: {
			debug: boolean
		}
	}

	export interface Global<T,J> extends Environment {
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

				test: any
			}
			script: Script
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

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;

			fifty.tests.suite = function() {
				var global: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, global);
				var subject: slime.internal.jrunscript.bootstrap.Global<{},{}> = global as slime.internal.jrunscript.bootstrap.Global<{},{}>;
				fifty.verify(subject).is.type("object");
				fifty.verify(subject).$api.is.type("object");
				fifty.verify(subject).$api.script.is.type("object");
			}
		}
	//@ts-ignore
	)(Packages,fifty);

}