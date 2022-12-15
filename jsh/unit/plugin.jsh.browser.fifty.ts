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

					/**
					 * See {@link slime.jrunscript.shell.browser.Chrome}'s Instance constructor.
					 */
					devtools?: boolean
					debugPort?: number
				}) => Browser

				Firefox: (configuration: {
					program: string
				}) => Browser

				Safari: () => Browser
			}


			selenium: {
				Chrome: () => Browser

				remote: {
					Chrome: (configuration: {
						host: string
						port: number
					}) => Browser

					Firefox: (configuration: {
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
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;
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
				browser.open({ uri: "https://github.com/davidpcaldwell/slime" });
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

			fifty.tests.manual.browsers.selenium.remote = {};

			var runDockerSelenium = function(image) {
				return jsh.shell.world.action(
					jsh.shell.Invocation.from.argument({
						command: "docker",
						arguments: $api.Array.build(function(rv) {
							rv.push("run");
							rv.push("-d");
							rv.push("-p", "4444:4444");
							rv.push("-p", "7900:7900");
							rv.push("--shm-size=2g");
							rv.push(image);
						}),
						stdio: {
							output: "string"
						}
					})
				)
			}

			var removeDockerContainer = function(id) {
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: "docker",
						arguments: $api.Array.build(function(rv) {
							rv.push("rm");
							rv.push("-f");
							rv.push(id);
						})
					}),
					{
						exit: function(e) {
							jsh.shell.console("Docker rm exit status: " + e.detail.status);
						}
					}
				);
			};

			fifty.tests.manual.browsers.selenium.remote.chrome = function() {
				var tell = runDockerSelenium("selenium/standalone-chrome");
				var container;
				$api.fp.world.now.tell(
					tell,
					{
						exit: function(e) {
							container = e.detail.stdio.output.trim();
							jsh.shell.console("container = [" + container + "]");
						}
					}
				);
				var chrome = subject.selenium.remote.Chrome({
					host: "127.0.0.1",
					port: 4444
				});
				manualTest(chrome);
				removeDockerContainer(container);
			}


			fifty.tests.manual.browsers.selenium.remote.firefox = function() {
				var tell = runDockerSelenium("selenium/standalone-firefox");
				var container;
				$api.fp.world.now.tell(
					tell,
					{
						exit: function(e) {
							container = e.detail.stdio.output.trim();
							jsh.shell.console("container = [" + container + "]");
						}
					}
				);
				var chrome = subject.selenium.remote.Firefox({
					host: "127.0.0.1",
					port: 4444
				});
				manualTest(chrome);
				removeDockerContainer(container);
			}

			fifty.tests.world = {};
			fifty.tests.world.installed = function() {
				jsh.unit.browser.installed.forEach(function(browser) {
					jsh.shell.console(browser.id + ": " + browser.name);
				})
			}
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
