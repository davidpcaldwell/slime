//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	export type Dependencies = Pick<slime.jsh.Global,"loader"|"js"|"web"|"file"> & {
		java: slime.jrunscript.java.Exports
		io: slime.jsh.Global["io"]
		shell: Pick<slime.jsh.Global["shell"],"HOME"|"TMPDIR"|"run"|"java"|"jsh"|"environment"|"echo"|"console"|"inject">
	}

	/**
	 * The jsh Servlet Plugin allows a servlet container to be configured with SLIME servlets and embedded inside a `jsh` script, so
	 * that the servlet container can serve HTTP requests. See the
	 * {@link slime.servlet | SLIME servlets} documentation for details on authoring SLIME servlets and deploying them to containers
	 * other than `jsh`.
	 *
	 * The jsh Servlet Plugin does not itself implement a servlet container. It relies on Apache Tomcat to be installed as part of
	 * the shell, or for its location to be specified via the `CATALINA_HOME` environment variable.
	 *
	 * **If the shell does not have Tomcat installed and `CATALINA_HOME` is not specified, the jsh Servlet Plugin will not be
	 * available.**
	 */
	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace servlet {
		export type Parameters = { [name: string]: any }

		type AnyDescriptor = {
			/**
			 * A set of servlet parameters to make available to the servlet via its `$parameters` variable. This object can contain
			 * properties of any type, but if the servlet is deployed and run in an ordinary container, the `$parameters` variable
			 * will contain the names and values of the servlet parameters, and hence may only have string values.
			 *
			 * (optional; default is an object with no properties)
			 */
			parameters?: Parameters
		}

		export interface DescriptorUsingLoad extends AnyDescriptor {
			/**
			 * A function providing the implementation of the servlet. The servlet will not be provided with a `$loader`, although
			 * the descriptor implementation can add one by assigning a `$loader` property to the scope argument.
			 */
			load: (scope: Omit<slime.servlet.Scope,"$loader"> & Pick<Partial<slime.servlet.Scope>,"$loader">) => void
		}

		export interface DescriptorUsingFile extends AnyDescriptor {
			/**
			 * The file providing the implementation of the servlet. The servlet will be supplied with a `$loader` variable that can
			 * load resources from its parent directory.
			 */
			file: slime.jrunscript.file.File
		}

		export interface DescriptorUsingResourcePath extends AnyDescriptor {
			//	TODO	is there a more specific link target for the servlet documentation pertaining to $loader?
			/**
			 * The path within the application's resource loader at which the servlet can be found. The servlet will be supplied
			 * with a `$loader` that can load resources from the servlet's parent path; see the
			 * {@link slime.servlet | SLIME servlet documentation}.
			 */
			resource: string
		}

		/**
		 * A declaration for a script-based servlet.
		 */
		export type Descriptor = DescriptorUsingLoad | DescriptorUsingFile | DescriptorUsingResourcePath

		export namespace configuration {
			export interface Servlets {
				/**
				 * A loader that loads Java web application resources by path.
				 */
				resources?: slime.old.Loader

				//	TODO	add reference to URL patterns from servlet specification -->

				/**
				 * An object whose property names are interpreted as URL patterns and property values are interpreted as servlet
				 * declarations.
				 */
				servlets?: { [pattern: string]: servlet.Descriptor }
			}

			export interface WebappServlet<T extends Descriptor = Descriptor> {
				resources: slime.old.Loader
				servlet: T
			}

			//	TODO	JSAPI documentation indicates this implementation does not work; unverified
			export interface WarFile {
				webapp: slime.jrunscript.file.Pathname
			}

			export type Context = Servlets | WarFile
		}
	}

	/**
	 * A Tomcat server.
	 */
	export interface Tomcat {
		/**
		 * The base directory being used by this instance of Tomcat.
		 */
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
		 *
		 * Configures the server to route requests for a particular request path to a particular webapp.
		 */
		map: (p: {
				//	TODO	it appears that `""` works for the value of `path` as well
				/**
				 * The path at which to deploy the webapp specified by the given argument, including the leading `/`.
				 */
				path: string
			}
			& slime.jsh.httpd.servlet.configuration.Context
		) => void

		/**
		 * @deprecated Webapps should be declared at the time of server creation.
		 *
		 * Configures the given servlet as a single top-level servlet in this Tomcat server.
		 */
		servlet: (servlet: servlet.Descriptor & { resources?: slime.old.Loader }) => void

		//	TODO	See jsh/test/manual/httpd.lifecycle.jsh.js for tests of the below.

		/**
		 * Starts the server; this method will not return until the server is ready to receive requests.
		 *
		 * This method does not block the `jsh` script from exiting; if the end of the script is reached, the server will be
		 * terminated.
		 */
		start: () => void

		/**
		 * Starts the server if necessary and then blocks until the server is stopped (for example, because `stop` is called).
		 *
		 * Note that if the server is started in the shell's main thread, and there are no other threads in use, the shell will
		 * never terminate.
		 */
		run: () => void

		//	TODO	when this method returns, has the server stopped?
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
				from: {
					configuration: (p: tomcat.Configuration & tomcat.Webapps) => Tomcat
				}
			}
		}

		servlet: {
			Servlets: {
				from: {
					//	TODO	in the given WebappServlet, it's legal to leave resources undefined. Nail down what this means and
					//			adjust types accordingly.
					root: (p: servlet.configuration.WebappServlet) => servlet.configuration.Servlets
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

			fifty.tests.exports.Tomcat = fifty.test.Parent();

			fifty.tests.exports.Tomcat.lifecycle = function() {
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
					jsh.http.Argument.from.request(request)
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
		/**
		 * Re-usable methods exported by this module which may be helpful in unrelated code.
		 */
		nugget: {
			/**
			 * Attempts to determine the MIME type of a file object. Current implementation uses both the Java `jrunscript/io
			 * mime.Type.guess` method and the `jrunscript/io mime.Type.fromName` method.
			 *
			 * @param file A file object.
			 * @returns A MIME type guessed for the file, or `undefined` if no type could be guessed.
			 */
			getMimeType: (file: slime.jrunscript.file.File) => slime.mime.Type
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.exports.nugget = function() {
				var type = jsh.httpd.nugget.getMimeType(fifty.jsh.file.object.getRelativePath("api.js").file);
				verify(type).media.is("application");
				verify(type).subtype.is("javascript");

				fifty.run(function html() {
					//	TODO	this will not work when JSAPI is eliminated; will need new HTML file
					var type = jsh.httpd.nugget.getMimeType(fifty.jsh.file.object.getRelativePath("../../../README.html").file);
					verify(type).media.is("text");
					verify(type).subtype.is("html");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		spi: {
			servlet: {
				inWebapp: (resources: slime.old.Loader, servlet: slime.jsh.httpd.servlet.Descriptor) => servlet.configuration.WebappServlet<servlet.DescriptorUsingLoad>
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
				fifty.run(fifty.tests.exports);
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
