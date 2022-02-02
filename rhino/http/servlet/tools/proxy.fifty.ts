//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * An experimental API providing the ability to run an HTTPS server that wraps an HTTP server; the API requires `jsh` presently.
 */
namespace slime.servlet.proxy {
	export interface Context {
		library: {
			web: slime.web.Exports
			io: slime.jrunscript.io.Exports
			ip: slime.jrunscript.ip.Exports
			http: slime.jrunscript.http.client.Exports
			jsh: {
				shell: slime.jsh.shell.Exports
				httpd: slime.jsh.httpd.Exports
			}
		}
	}

	export interface Configuration {
		/**
		 * The host names for which this server will support HTTPS.
		 */
		hosts: string[]

		/**
		 * A delegate server to which to forward all requests via HTTP.
		 */
		server: {
			/**
			 * The port number on which the underlying server listens for HTTP connections.
			 */
			http: number
		}
	}

	export interface Exports {
		/**
		 * Creates and starts an HTTPS server that wraps an HTTP server.
		 *
		 * @experimental
		 */
		create: (configuration: Configuration) => slime.jsh.httpd.Tomcat

		test: {
			mkcert: (hosts: string[]) => slime.jrunscript.file.File
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.kit) {
			var script: Script = fifty.$loader.script("proxy.js");
			return script({
				library: {
					web: fifty.global.jsh.web,
					io: fifty.global.jsh.io,
					ip: fifty.global.jsh.ip,
					http: fifty.global.jsh.http,
					jsh: {
						shell: fifty.global.jsh.shell,
						httpd: fifty.global.jsh.httpd
					}
				}
			});
		//@ts-ignore
		})(fifty)
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.world = {};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.world.mkcert = function() {
				var file = test.subject.test.mkcert([ "proxy.example.com", "127.0.0.1" ]);
				fifty.global.jsh.shell.console("file = " + file);
			}
		}
	//@ts-ignore
	)(fifty);



	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
