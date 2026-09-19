//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.test.internal.browser.script {
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

	export type Script = slime.runtime.loader.Scoped<Context,Exports>
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
				jsh.shell.Invocation.from.argument({
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
	}
//@ts-ignore
)(fifty);
