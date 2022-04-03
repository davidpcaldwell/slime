//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.browser {
	export namespace object {
		export interface Instance {
			launch: any
			run: any
		}

		export interface Chrome extends slime.jrunscript.shell.browser.Chrome {
			Instance: new (u: {
				location?: slime.jrunscript.file.Pathname
				directory?: slime.jrunscript.file.Directory
				proxy?: ProxyTools
				hostrules?: string[]
				install?: boolean
				devtools?: boolean
			}) => Instance
		}
	}
}
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
		Installation: (p: {
			executable: string

			/**
			 * The default user data directory for this installation.
			 */
			user: string
		}) => object.Chrome
	}

	export interface Exports {
		installed: object.Chrome
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
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.kit
		) {
			const { jsh } = fifty.global;

			const { subject } = test;

			fifty.tests.world = function() {
				var version = subject.installed.version;
				fifty.global.jsh.shell.console("Chrome version = [" + version + "]");
			}

			fifty.tests.manual = {};
			fifty.tests.manual.chrome = {};
			fifty.tests.manual.chrome.Installation = function() {
				//	macOS: env JSH_TEST_SHELL_CHROME_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" JSH_TEST_SHELL_CHROME_USER="${HOME}/Library/Application Support/Google/Chrome"
				var chrome = subject.Installation({
					executable: jsh.shell.environment.JSH_TEST_SHELL_CHROME_EXECUTABLE,
					user: jsh.shell.environment.JSH_TEST_SHELL_CHROME_USER
				});
				var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var instance = new chrome.Instance({
					location: TMP.pathname
				});
				var process;
				jsh.java.Thread.start(function() {
					Packages.java.lang.System.err.println("Starting ...");
					try {
						instance.run({
							uri: "https://google.com/",
							on: {
								start: function(p) {
									Packages.java.lang.System.err.println("Got start callback.");
									process = p;
								}
							}
						});
					} catch (e)  {
						jsh.shell.console(e);
						jsh.shell.console(e.stack);
					}
				});
				Packages.java.lang.Thread.sleep(5000);
				process.kill();
			}
		}
	//@ts-ignore
	)(Packages,fifty);


	export type Script = slime.loader.Script<Context,Exports>
}
