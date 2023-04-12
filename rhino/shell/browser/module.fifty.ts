//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell.browser {
	export interface Context {
		api: {
			js: any
			java: any
			file: any
			httpd: {
				Tomcat: () => jsh.httpd.Tomcat
			}
		}
		os: any
		run: any
		HOME: slime.jrunscript.file.Directory
		TMPDIR: slime.jrunscript.file.Directory
		environment: any
	}

	export namespace old {
		export interface ProxyConfiguration {
			/**
			 * JavaScript code for a Proxy Auto-Configuration file, allowing the use of JavaScript code to define the mapping between
			 * hosts and proxies. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file)
			 * for documentation of this format.
			 */
			code?: string

			/** @deprecated Use `code`. */
			pac?: string

			port?: number
		}
	}

	export interface ProxyTools {
		Server: () => {
			url: string
			start: () => void
			stop: () => void
		}
		code: string
		response: slime.servlet.Response
	}

	export interface Exports {
		inject: any

		chrome: object.Chrome

		Chrome: {
			getMajorVersion: (chrome: Chrome) => number

			Installation: (p: {
				/**
				 * The Chrome executable for this installation.
				 */
				 program: string

				/**
				 * The default user data directory for this installation.
				 */
				user: string
			}) => object.Chrome
		}

		installed: {
			/**
			 * An object representing the global Chrome installation, or `undefined` if it is not installed or not detected.
			 */
			chrome: Chrome
		}

		ProxyConfiguration: {
			(o: old.ProxyConfiguration): ProxyTools

			Server: (o: old.ProxyConfiguration) => ReturnType<slime.jrunscript.shell.browser.ProxyTools["Server"]>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const code: Script = fifty.$loader.script("module.js");

			const api = code({
				os: jsh.shell.os,
				HOME: jsh.shell.HOME,
				TMPDIR: jsh.shell.TMPDIR,
				run: jsh.shell.run,
				environment: {},
				api: {
					js: jsh.js,
					java: jsh.java,
					file: jsh.file,
					httpd: {
						Tomcat: jsh.httpd.Tomcat
					}
				}
			});

			fifty.tests.jsapi = fifty.test.Parent();

			fifty.tests.jsapi._1 = function() {
				if (api && api.ProxyConfiguration.Server) {
					var port = jsh.ip.tcp.getEphemeralPortNumber();
					verify(port,"port").is(port); // this is just explication for the tests
					var proxy = api.ProxyConfiguration.Server({ port: port });
					proxy.start();
					var client = new jsh.http.Client();
					var response = client.request({
						url: proxy.url,
						evaluate: function(response) {
							return { string: response.body.stream.character().asString() };
						}
					});
					verify(response).string.is.type("string");
					verify(response).string.is(response.string);
					verify(response).evaluate(function(): number { return this.string.indexOf(String(port)); }).is.not(-1);
					proxy.stop();

					var code = fifty.$loader.get("proxy.pac.js").read(String);
					var pacProxy = api.ProxyConfiguration({ pac: code });
					var server = pacProxy.Server();
					server.start();
					var servedCode = client.request({
						url: server.url,
						evaluate: function(response) {
							return { string: response.body.stream.character().asString() };
						}
					});
					verify(servedCode).string.is(code);
					verify(pacProxy).code.is(code);
					server.stop();
				}
			};

			fifty.tests.jsapi._2 = function() {
				if (api && jsh.httpd.Tomcat && jsh.shell.browser.chrome) {
					jsh.shell.console("Creating Tomcat.");

					var tomcat = jsh.httpd.Tomcat();
					var browser;

					var requested;
					var lock = new jsh.java.Thread.Monitor();

					tomcat.map({
						path: "",
						servlets: {
							"/*": {
								load: function(scope) {
									scope.$exports.handle = function(request) {
										jsh.shell.console("Got request");
										var headers = $api.Object({ properties: request.headers });
										if (headers.host == "clientservices.googleapis.com") {
											//	Chrome seems to automatically make a request on startup,
											//	which sometimes arrives before the URL sent as a command line
											//	argument
											return;
										}
										requested = request;
										if (requested)
										jsh.shell.console("Releasing lock for request");
										lock.Waiter({
											until: function() {
												return true;
											},
											then: function() {
											}
										})();
										jsh.shell.console("Released lock for request");
										return void(0);
									}
								}
							}
						}
					});

					tomcat.start();

					var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
					TMP.getRelativePath("First Run").write("", { append: false });

					var instance = new api.chrome.Instance({
						directory: TMP,
						proxy: api.ProxyConfiguration({
							port: tomcat.port
						})
					});

					jsh.shell.console("Launching page ...");
					jsh.java.Thread.start(function() {
						jsh.shell.console("Creating browser ...");
						try {
							instance.run({
								uri: "http://slime-test/",
								on: {
									start: function(p) {
										jsh.shell.console("Got callback for browser process");
										browser = p;
									}
								}
							});
							jsh.shell.console("Browser terminated.");
						} catch (e) {
							jsh.shell.console("Error creating browser: " + e);
						}
					})

					lock.Waiter({
						until: function() {
							return requested;
						},
						then: function() {
							tomcat.stop();
							browser.kill();
						}
					})();

					verify(requested).is.type("object");
					var headers = $api.Object({ properties: requested.headers });
					verify(headers).host.evaluate(String).is("slime-test");
				}
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
