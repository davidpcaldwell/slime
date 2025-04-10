//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.ui {
	export interface Application {
		browser: any
	}

	export interface Exports {
		application: (
			p: slime.jsh.ui.application.Argument,
			events?: $api.event.Function.Receiver
		) => Application & {
			server: slime.jsh.ui.application.Server
			port: number
		}

		configuration: {
			browser: {
				network: {
					from: {
						host: (host: string) => slime.jsh.ui.application.Configuration["browser"]["network"]
					}
				}
			}

			//	Implemented in plugin.jsh.js
			https?: (p: {
				hosts: string[]
			}) => {
				tomcat: slime.jsh.httpd.tomcat.Configuration["https"]
				chrome: {
					hostrules: string[]
				}
			}
		}

		object: {
			Application: slime.$api.fp.world.Sensor<
				slime.jsh.ui.application.Configuration,
				slime.jsh.ui.application.Events,
				Application & {
					server: slime.jsh.httpd.Tomcat
				}
			>
		}
	}
}

namespace slime.jsh.ui.application {
	export type Server = Pick<slime.jsh.httpd.Tomcat,"start" | "stop" | "port">

	export interface ServerConfiguration extends slime.jsh.httpd.tomcat.Configuration, slime.jsh.httpd.servlet.configuration.WebappServlet {
	}

	export interface ServerRunning {
		server: Server
	}

	export type ServerSpecification = ServerRunning | ServerConfiguration

	export interface ChromeConfiguration {
		location?: slime.jrunscript.file.Pathname
		directory?: slime.jrunscript.file.Directory
		browser?: boolean
		debug?: {
			port?: number
		}

		/**
		 * A Chrome feature allowing host resolution rules to be specified. See [this list](http://imfly.github.io/electron-docs-gitbook/en/api/chrome-command-line-switches.html)
		 * of Chrome command-line switches for one explanation of how these values work.
		 *
		 * The rules are represented as an array in this API (on the command line, they are delimited by `,`).
		 */
		hostrules?: string[]
	}

	export interface BrowserSpecification {
		proxy?: slime.jrunscript.shell.browser.old.ProxyConfiguration
			| ( (p: { port: number }) => slime.jrunscript.shell.browser.old.ProxyConfiguration )

		/**
		 * If `proxy` is not specified, this value provides a simple way of mapping all requests for the given host to the HTTP
		 * port of the application's server, and routing all other requests to their hosts.
		 */
		host?: string

		chrome?: ChromeConfiguration

		run?: any
		zoom?: any
		console?: any
		create?: any
	}

	/**
	 * @deprecated Use {@link slime.jsh.ui.application.BrowserSpecification}.
	 */
	export type BrowserFunction = (p: any) => void

	export type BrowserConfiguration = BrowserSpecification | BrowserFunction

	export interface ClientSpecification {
		browser: BrowserConfiguration

		url?: string

		/**
		 * The path in the server application to open when opening the application.
		 */
		path?: string
	}

	export interface EventsConfiguration {
		close: () => void
	}

	export interface Events {
		started: Server
		close: void
	}

	export interface EventsSpecification {
		on?: EventsConfiguration
	}

	export interface Deprecated {
		/** @deprecated */
		zoom?: any
		/** @deprecated */
		console?: any
	}

	export type Argument = ServerSpecification & ClientSpecification & EventsSpecification & Deprecated

	export interface Configuration {
		server: ServerConfiguration
		browser: {
			network?: (p: { port: number }) => {
				url: string
				pac?: string
			}
			chrome: ChromeConfiguration
		}
	}
}

namespace slime.jsh.ui.internal.application {
	export interface Context {
		library: {
			java: slime.jrunscript.java.Exports
			shell: slime.jrunscript.shell.Exports
		}

		input: {
			chrome: slime.$api.fp.impure.Input<slime.jrunscript.shell.browser.object.Chrome>
		}

		console: slime.$api.fp.impure.Output<string>

		jsh: {
			httpd: slime.jsh.Global["httpd"]
			ui: slime.jsh.Global["ui"]
		}
	}

	export interface Exports {
		old: slime.jsh.ui.Exports["application"]
		configuration: slime.jsh.ui.Exports["configuration"]
		object: slime.jsh.ui.Exports["object"]["Application"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const script: Script = fifty.$loader.script("application.js");

			const api = script({
				library: {
					java: jsh.java,
					shell: jsh.shell
				},
				input: {
					chrome: $api.fp.impure.Input.value(jsh.shell.browser.chrome)
				},
				console: jsh.shell.console,
				jsh: {
					httpd: jsh.httpd,
					ui: jsh.ui
				}
			});

			fifty.tests.suite = function() {
				//	jsh.httpd.Tomcat supplies default server implementation
				//	TODO	do we need to disable this whole thing when Chrome is not available?
				if (jsh.httpd.Tomcat && jsh.shell.browser.chrome) {
					verify("hello").is("hello");

					var singleRequestApplication = function(decorator?) {
						var firstRequest: servlet.Request;
						var slock = new jsh.java.Thread.Monitor();

						var argument = new function() {
							const servlet: slime.jsh.httpd.servlet.DescriptorUsingLoad = {
								load: function(scope) {
									scope.$exports.handle = function(request) {
										slock.Waiter({
											until: function() {
												return true;
											},
											then: function() {
												if (!firstRequest) firstRequest = request;
											}
										})();
										return void(0);
									}
								}
							};

							this.servlet = servlet;

							this.on = {
								close: function() {
									jsh.shell.console("Closed browser.");
								}
							};

							this.browser = {
								chrome: {}
							};
						};

						if (decorator) decorator.call(argument);

						var application = api.old(argument);

						slock.Waiter({
							until: function() {
								return Boolean(firstRequest);
							},
							then: function() {
								application.browser.close();
								application.server.stop();
							}
						})();

						return {
							application: application,
							request: firstRequest
						}
					};

					var getHeader = function(name: string): () => string {
						return function() {
							for (var i=0; i<this.headers.length; i++) {
								if (this.headers[i].name.toLowerCase() == name) {
									return this.headers[i].value;
								}
							}
							return null;
						}
					};

					var first = singleRequestApplication();
					verify(first).request.method.is("GET");
					verify(first).request.path.is("");
					verify(first).request.evaluate(getHeader("host")).is("127.0.0.1:" + first.application.server.port);

					var second = singleRequestApplication(function() {
						this.browser.host = "x";
					});
					verify(second).request.method.is("GET");
					verify(second).request.path.is("");
					verify(second).request.evaluate(getHeader("host")).is("x");

					var invoked = false;
					var third = singleRequestApplication(function() {
						this.browser.proxy = function(server) {
							invoked = true;
							return { port: server.port };
						}
					});
					verify(invoked).is(true);
				}
			}

			fifty.tests.manual = function() {
				var object = $api.fp.world.now.question(
					api.object,
					{
						server: {
							resources: fifty.$loader,
							servlet: {
								load: function(scope) {
									scope.$exports.handle = function(request) {
										return {
											status: { code: 200 },
											body: {
												type: "application/json",
												string: JSON.stringify(request, void(0), 4)
											}
										};
									}
								}
							}
						},
						browser: {
							network: api.configuration.browser.network.from.host("foo.bar.baz"),
							chrome: {
								browser: true
							}
						}
					},
					{
						started: function(e) {
							jsh.shell.console("Started: port = " + e.detail.port);
						},
						close: function(e) {
							jsh.shell.console("Event received: close.");
						}
					}
				);
				object.server.start();
				object.server.run();
				jsh.shell.console("Server exited.");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
