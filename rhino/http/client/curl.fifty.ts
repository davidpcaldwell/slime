//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a **very rough**, **experimental** drop-in replacement for the {@link slime.jrunscript.http.client.World}
 * `request` method that is implemented in terms of `curl`.
 *
 * Currently, `curl` must be on the `PATH` in order for this method to work, and it has several limitations:
 *
 * * it only accepts request bodies that are string data
 * * it only handles responses containing string data
 * * it does not support the read timeout supported by the `request` method
 */
namespace slime.jrunscript.http.client.curl {
	export interface Context {
		console: (message: string) => void
		library: {
			io: slime.jrunscript.io.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export type Exports = (configuration?: {
		unixSocket?: string
	}) => slime.jrunscript.http.client.Exports["world"]["request"]

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			var script: Script = fifty.$loader.script("curl.js");

			var api = script({
				console: jsh.shell.console,
				library: {
					io: jsh.io,
					shell: jsh.shell
				}
			});

			fifty.tests.lab = function() {
				var subject = api();
				fifty.load("module.fifty.ts", "types.spi.Implementation", subject);
			}

			fifty.tests.manual = {};

			fifty.tests.manual.docker = function() {
				var implementation = api({
					unixSocket: "/var/run/docker.sock"
				});
				var response = implementation({
					request: {
						method: "GET",
						url: "http://docker.local.unix/info",
						headers: []
					},
					timeout: {
						connect: void(0),
						read: void(0)
					}
				})();
				jsh.shell.console("status = " + response.status);
				jsh.shell.console("headers = " + JSON.stringify(response.headers));
				jsh.shell.console("stream = " + JSON.stringify(JSON.parse(response.stream.character().asString()), void(0), 4));
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.lab);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
