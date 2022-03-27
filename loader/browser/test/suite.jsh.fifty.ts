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
			fifty: slime.fifty.test.kit
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

			function run(browser: string, suite: string = "contributor/browser-jsapi-suite.js"): slime.jrunscript.shell.run.Events["exit"] {
				var rv: slime.jrunscript.shell.run.Events["exit"];
				jsh.shell.world.run(
					jsh.shell.Invocation.create({
						command: "/bin/bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh.bash").toString())
							rv.push("loader/browser/test/suite.jsh.js");
							rv.push("-suite", suite);
							rv.push("-browser", browser);
							rv.push("-view", "stdio");
						}),
						directory: jsh.shell.jsh.src.toString()
					})
				)({
					exit: function(e) {
						rv = e.detail;
					}
				});
				return rv;
			}

			fifty.tests.manual.chrome = function() {
				var result = run("chrome");
				jsh.shell.console("Exit status: " + result.status);
			}

			fifty.tests.manual.selenium = function() {
				var result = run("selenium:chrome");
				jsh.shell.console("Exit status: " + result.status);
			}

			fifty.tests.manual.docker = {
				selenium: {
					chrome: function() {
						var result = run("docker:selenium:chrome");
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
