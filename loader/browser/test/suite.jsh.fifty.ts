//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.browser.test {
	export namespace results {
		export interface Context {
			library: {
				java: slime.jsh.Global["java"]
				shell: slime.jsh.Global["shell"]
			}
		}

		interface Configuration {
			url: string
		}

		export type Factory = (configuration: Configuration) => slime.servlet.handler
	}
}

namespace slime.runtime.browser.test.internal.suite {
	export interface Browser {
		name: string

		start: (p: {
			uri: string
		}) => void

		kill: () => void
	}

	export interface Host {
		port: number
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			fifty.tests.manual = {};

			fifty.tests.chrome = fifty.test.Parent();

			fifty.tests.chrome.success = function() {
				if (jsh.shell.browser.chrome) jsh.shell.jsh({
					shell: jsh.shell.jsh.src,
					script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
					arguments: [
						"-suite", jsh.shell.jsh.src.getFile("loader/browser/test/test/issue300.suite.js"),
						"-browser", "chrome"
					],
					evaluate: function(result: { status: number }) {
						verify(result).status.is(0);
					}
				});
			};

			fifty.tests.chrome.failure = function() {
				if (jsh.shell.browser.chrome) jsh.shell.jsh({
					shell: jsh.shell.jsh.src,
					script: jsh.shell.jsh.src.getFile("loader/browser/test/suite.jsh.js"),
					arguments: [
						"-suite", jsh.shell.jsh.src.getFile("loader/browser/test/test/issue300.suite.js"),
						"-browser", "chrome",
						"-parameter", "failure=true"
					],
					evaluate: function(result: { status: number }) {
						verify(result).status.is(1);
					}
				})
			};

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.chrome);
			}

			function run(browser: string, suite: string = "contributor/browser-jsapi-suite.js"): slime.jrunscript.shell.run.TellEvents["exit"] {
				var rv: slime.jrunscript.shell.run.TellEvents["exit"];
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: "/bin/bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh.bash").toString())
							rv.push("loader/browser/test/suite.jsh.js");
							rv.push("-suite", suite);
							rv.push("-browser", browser);
							rv.push("-view", "stdio");
						}),
						directory: jsh.shell.jsh.src.toString()
					}),
					{
						exit: function(e) {
							rv = e.detail;
						}
					}
				);
				return rv;
			}

			fifty.tests.manual.chrome = function() {
				var result = run("chrome");
				jsh.shell.console("Exit status: " + result.status);
			}

			fifty.tests.manual.firefox = function() {
				var result = run("firefox");
				jsh.shell.console("Exit status: " + result.status);
			}

			fifty.tests.manual.selenium = {
				chrome: function() {
					var result = run("selenium:chrome");
					jsh.shell.console("Exit status: " + result.status);
				}
			}

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

			fifty.tests.manual.docker = {
				selenium: {
					chrome: function() {
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
						var result = run("docker:selenium:chrome");
						removeDockerContainer(container);
						jsh.shell.console("Exit status: " + result.status);
					}
				},
				compose: {
					selenium: {
						chrome: function() {
							jsh.shell.console("Installing Selenium ...");
							jsh.shell.jsh({
								shell: jsh.shell.jsh.src,
								script: jsh.shell.jsh.src.getFile("jsh/tools/install/selenium.jsh.js")
							});
							jsh.shell.console("Installed Selenium.");
							var result = run("dockercompose:selenium:chrome");
							jsh.shell.console("Exit status: " + result.status);
						}
					}
				}
			}
		}
	//@ts-ignore
	)(fifty);
}
