//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.browser.test.internal.script {
	export interface Context {
	}

	export interface Chrome {
		location: slime.jrunscript.file.Pathname
		devtools: boolean
		debugPort: number
	}

	export interface SeleniumChrome {
	}

	export interface RemoteSelenium {
		browser: {
			host: string
			port: number
		}
	}

	export interface Exports {
	}

	export type Script = slime.loader.Script<Context,Exports>
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { $api, jsh } = fifty.global;

		fifty.tests.manual = {};

		var run = function(browser) {
			$api.fp.world.now.action(
				jsh.shell.world.action,
				jsh.shell.Invocation.create({
					command: "/bin/bash",
					arguments: $api.Array.build(function(rv) {
						rv.push("./fifty");
						rv.push("test.browser");
						rv.push("contributor/browser.fifty.ts");
						rv.push("--browser", browser);
					}),
					directory: jsh.shell.jsh.src.toString()
				}),
				{
					exit: function(e) {
						jsh.shell.console("Status: " + e.detail.status);
					}
				}
			);
		}

		fifty.tests.manual.chrome = function() {
			run("chrome");
		}

		fifty.tests.manual.firefox = function() {
			run("firefox");
		}

		fifty.tests.manual.selenium = {};

		fifty.tests.manual.selenium.chrome = function() {
			run("selenium:chrome");
		}

		fifty.tests.manual.docker = {
			compose: {
				selenium: {
					chrome: function() {
						jsh.shell.console("Installing Selenium ...");
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.shell.jsh.src.getFile("jsh/tools/install/selenium.jsh.js")
						});
						jsh.shell.console("Installed Selenium.");
						run("dockercompose:selenium:chrome");
					},
					firefox: function() {
						jsh.shell.console("Installing Selenium ...");
						jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: jsh.shell.jsh.src.getFile("jsh/tools/install/selenium.jsh.js")
						});
						jsh.shell.console("Installed Selenium.");
						run("dockercompose:selenium:firefox");
					}
				}
			}
		}
	}
//@ts-ignore
)(fifty);
