//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * An experimental API providing the ability to run an HTTPS server that wraps an HTTP server; the API requires `jsh` presently.
 * It can also connect a Chrome browser to that same server, providing Chrome hostrules that enable using HTTPS requests that do
 * not require port numbers.
 */
namespace slime.servlet.proxy {
	export interface Context {
		library: {
			web: slime.web.Exports
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			ip: slime.jrunscript.ip.Exports
			http: slime.jrunscript.http.client.Exports
			jsh: {
				shell: slime.jsh.Global["shell"]
				httpd: slime.jsh.httpd.Exports
			}
		}
	}

	/**
	 * A server that proxies requests to an underlying server via HTTP.
	 */
	export interface Server {
		/**
		 * The host names for which this server will support HTTPS.
		 */
		hosts: string[]

		/**
		 * A delegate server to which to forward all requests via HTTP.
		 */
		delegate: {
			/**
			 * The port number on which the underlying server listens for HTTP connections.
			 */
			port: number
		}

		override?: {
			redirect?: (redirect: {
				request: slime.servlet.Request
				location: string
			}) => string
		}
	}

	export interface Application extends Server {
		chrome: {
			location: slime.jrunscript.file.Pathname
			uri: string
		}
	}

	export namespace internal {
		export type https = (p: {
			/**
			 * A set of hosts to which to support https requests.
			 */
			hosts: string[]
		}) => slime.jsh.httpd.tomcat.Configuration["https"]
	}

	export interface Exports {
		/**
		 * Creates and starts an HTTPS server that wraps an HTTP server.
		 *
		 * @experimental
		 */
		server: (configuration: Server) => slime.jsh.httpd.Tomcat

		application: (configuration: Application) => void

		test: {
			mkcert: (hosts: string[]) => slime.jrunscript.file.File
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("proxy.js");
			return script({
				library: {
					web: fifty.global.jsh.web,
					java: fifty.global.jsh.java,
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
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.world = {};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
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
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
