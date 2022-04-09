//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export namespace old {
		export interface Browser {
			id: string
			name: string
			delegate: any
		}
	}

	export interface Browser {
		open: (p: {
			uri: string
		}) => void

		close: () => void
	}

	export interface Exports {
		browser: {
			/**
			 * Browsers in precedence order
			 */
			installed: slime.jsh.unit.old.Browser[] & {
				[id: string]: slime.jsh.unit.old.Browser
			}

			local: {
				Chrome: (configuration: {
					program: string
					user: string
					devtools?: boolean
					debugPort?: number
				}) => Browser

				Firefox: (configuration: {
					program: string
				}) => Browser
			}


			selenium: {
				Chrome: () => Browser

				remote: {
					Chrome: (configuration: {
						host: string
						port: number
					}) => Browser
				}
			}

			//	TODO	below are probably unused
			Modules: any
			Browser: any
			IE: any
			Firefox: any
			Chrome: any
			Safari: any
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.kit
		) {
			const { jsh } = fifty.global;
			var subject = jsh.unit.browser;

			fifty.tests.manual = {};
			fifty.tests.manual.old = {};
			fifty.tests.manual.old.browsers = function() {
				jsh.unit.browser.installed.forEach(function(installed) {
					jsh.shell.console("id = " + installed.id);
					jsh.shell.console("name = " + installed.name);
					jsh.shell.console("delegate = " + installed.delegate);
				})
			}

			function manualTest(browser: Browser) {
				browser.open({ uri: "https://www.google.com/ "});
				jsh.shell.console("Sleeping ...");
				Packages.java.lang.Thread.sleep(5000);
				jsh.shell.console("Closing ...");
				browser.close();
				jsh.shell.console("Closed.");
			}

			fifty.tests.manual.browsers = {};

			fifty.tests.manual.browsers.chrome = function() {
				var chrome = subject.local.Chrome({
					program: jsh.shell.browser.installed.chrome.program,
					user: jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.toString()
				});
				manualTest(chrome);
			};

			fifty.tests.manual.browsers.firefox = function() {
				var firefox = subject.local.Firefox({
					//	TODO	push knowledge of these locations back into rhino/shell
					program: "/Applications/Firefox.app/Contents/MacOS/firefox"
					//	Linux: /usr/bin/firefox
				});
				manualTest(firefox);
			}

			fifty.tests.manual.browsers.selenium = {};

			fifty.tests.manual.browsers.selenium.chrome = function() {
				var driven = subject.selenium.Chrome();
				manualTest(driven);
			}

			fifty.tests.manual.browsers
		}
	//@ts-ignore
	)(Packages,fifty);
}

namespace slime.jsh.unit.internal.browser {
	export interface Configuration {
		program: string
		arguments: string[]
	}
}
