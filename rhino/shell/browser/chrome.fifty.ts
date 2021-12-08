//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.browser.internal.chrome {
	export interface Context {
		os: any
		run: any
		api: {
			js: any
			java: any
			file: any
		}
		HOME: slime.jrunscript.file.Directory
		TMPDIR: slime.jrunscript.file.Directory
		environment: any
	}

	export interface Exports {
		getMajorVersion: (chrome: slime.jrunscript.shell.browser.Chrome) => number
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.kit) {
			var script: Script = fifty.$loader.script("chrome.js");
			return script({
				HOME: fifty.global.jsh.shell.HOME,
				TMPDIR: fifty.global.jsh.shell.TMPDIR,
				api: {
					js: fifty.global.jsh.js,
					java: fifty.global.jsh.java,
					file: fifty.global.jsh.file
				},
				environment: fifty.global.jsh.shell.environment,
				//	TODO	these can't be right
				os: fifty.global.jsh.shell.os,
				run: fifty.global.jsh.shell.run
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { verify } = fifty;
			const { subject } = test;

			fifty.tests.getMajorVersion = function() {
				verify(subject).getMajorVersion({ version: "Google Chrome 96.0.4664.93" }).is(96);
			}
		}
	//@ts-ignore
	)(fifty);


	export interface Exports {
		object: object.Chrome
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.getMajorVersion);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			const { subject } = test;

			fifty.tests.world = function() {
				var version = subject.object.version;
				fifty.global.jsh.shell.console("Chrome version = [" + version + "]");
			}
		}
	//@ts-ignore
	)(fifty);


	export type Script = slime.loader.Script<Context,Exports>
}