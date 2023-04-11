//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	export namespace servlet {
		export type Parameters = { [name: string]: any }

		type common = {
			parameters?: Parameters
		}

		export interface byLoad extends common {
			load: (scope: slime.servlet.Scope) => void
		}

		export interface byFile extends common {
			file: slime.jrunscript.file.File
		}

		export interface byResource extends common {
			resource: string
		}

		export type descriptor = byLoad | byFile | byResource

		export namespace configuration {
			export interface Servlets {
				resources?: slime.old.Loader
				servlets?: { [pattern: string]: servlet.descriptor }
			}

			export interface Webapp {
				webapp: slime.jrunscript.file.Pathname
			}

			export type Context = Servlets | Webapp
		}
	}

	export interface Tomcat {
		base: slime.jrunscript.file.Directory

		/**
		 * The port number on which the HTTP server is running.
		 */
		port: number

		https: {
			port: number
		}

		/**
		 * @deprecated Webapps should be declared at the time of server creation.
		 */
		map: (p: { path: string } & slime.jsh.httpd.servlet.configuration.Context) => void

		/**
		 * @deprecated Webapps should be declared at the time of server creation.
		 *
		 * Configures the given servlet as a single top-level servlet in this Tomcat server.
		 */
		servlet: (servlet: servlet.descriptor & { resources?: slime.old.Loader }) => void

		/**
		 * Starts the server; this method will not return until the server is ready to receive requests.
		 */
		start: () => void

		/**
		 * A method that, when invoked, starts the server if necessary and then blocks until the server is stopped.
		 */
		run: () => void

		/**
		 * Stops the server. Note that if a call to `run()` is running in another thread, stopping the server will cause that thread
		 * to unblock and continue.
		 */
		stop: () => void
	}

	export namespace tomcat {
		export interface SingleWebapp {
			webapp: slime.jsh.httpd.servlet.configuration.Context
		}

		export interface MultipleWebapps {
			webapps: {
				[path: string]: slime.jsh.httpd.servlet.configuration.Context
			}
		}

		/** @deprecated Should be declaring webapps at time of server creation. */
		export type NoWebapps = {};

		export type Webapps = SingleWebapp | MultipleWebapps

		/** @deprecated Should be declaring webapps at time of server creation. */
		export type OldWebapps = Webapps | NoWebapps

		export interface Configuration {
			/**
			 * The port on which the server's HTTP service should run; if omitted, an ephemeral port will be used.
			 */
			port?: number

			/**
			 * If present, describes an HTTPS service that should run.
			 */
			https?: {
				port?: number

				/**
				 * If provided, the specified keystore will be used when setting up the HTTPS service; one useful way to do this is
				 * using the `mkcert` integration provided by {@link slime.jsh.shell.tools.Exports}. If this property is omitted, a
				 * default keystore will be generated and used.
				 */
				keystore?: {
					file: slime.jrunscript.file.File
					password: string
				}
			}

			/**
			 * The base directory against which the server should run; if omitted, a temporary directory will be used.
			 */
			base?: slime.jrunscript.file.Directory
		}
	}

	export interface Exports {
		Tomcat?: {
			(p?: tomcat.Configuration & tomcat.OldWebapps): Tomcat

			serve: (p: tomcat.Configuration & { directory: slime.jrunscript.file.Directory }) => slime.jsh.httpd.Tomcat
		}

		tomcat: {
			Server: {
				from: (p: tomcat.Configuration & tomcat.Webapps) => Tomcat
			}
		}

		servlet: {
			Servlets: {
				from: {
					root: (p: {
						servlet: servlet.descriptor
						resources?: slime.old.Loader
					}) => servlet.configuration.Servlets
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.Tomcat = fifty.test.Parent();

			fifty.tests.Tomcat.lifecycle = function() {
				var server = jsh.httpd.Tomcat();
				server.servlet({
					load: function(scope) {
						scope.$exports.handle = function(request) {
							return {
								status: { code: 404 }
							}
						}
					}
				});
				server.start();
				var request: slime.jrunscript.http.client.Request = {
					url: "http://127.0.0.1:" + server.port + "/"
				};
				var ask = jsh.http.world.java.urlconnection(
					jsh.http.Argument.request(request)
				);
				var response = $api.fp.world.now.ask(ask);
				verify(response).status.code.is(404);
				//	This part of the test is essentially a manual test of lifecycle implementation
				jsh.shell.console("Starting stop() thread ...");
				jsh.java.Thread.start(function() {
					jsh.java.Thread.sleep(2000);
					jsh.shell.console("Stopping ...");
					server.stop();
					jsh.shell.console("Stopped.");
				});
				jsh.shell.console("Running ...");
				server.run();
				jsh.shell.console("Exiting.");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		nugget: any

		spi: {
			servlet: {
				environment: (resources: slime.old.Loader, servlet: slime.jsh.httpd.servlet.descriptor) => {
					resources: slime.old.Loader
					descriptor: servlet.byLoad
				}
			}
		}

		Resources: slime.jsh.httpd.resources.Exports

		plugin: {
			tools: () => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Tomcat);
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jsh {
	export interface Global {
		httpd: slime.jsh.httpd.Exports
	}
}
