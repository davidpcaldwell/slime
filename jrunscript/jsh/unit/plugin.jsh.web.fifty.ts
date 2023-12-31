//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export interface Exports {
		/**
		 * Provides scaffolding for mocking the entire Internet, as well as mock implementations of external services like GitHub,
		 * Bitbucket, and Git/Mercurial hosting.
		 */
		mock: {
			Web: {
				new (o?: {
					trace: boolean
				}): slime.jsh.unit.mock.Web

				bitbucket: (o: {
					loopback: boolean

					/**
					 * An object whose properties represent Bitbucket users, and whose properties' properties represent
					 * repositories.
					 */
					src: {
						[user: string]: {
							[repository: string]: {
								directory: any
								downloads: any
							}
						}
					}
				}) => slime.jsh.unit.mock.handler

				github: slime.jsh.unit.mock.web.Github
			}

			Internet: Exports["mock"]["Web"]

			Hg: {
				host: new (p: {}) => {
					port: any
					start: (p?: {}) => any
					stop: () => void
				}
			}

			git: any
		}
	}
}

namespace slime.jsh.unit.mock {
	/**
	 * The `handler` type for the mock web is an ordinary servlet handler extended with an optional stop() method that is called
	 * when the mock web is stopped.
	 */
	export type handler = slime.servlet.handler & { stop?: () => void }

	export interface Web {
		addHttpsHost: (host: string) => void

		/**
		 * Adds a handler that can supply parts of the mock internet.
		 */
		add: (handler: jsh.unit.mock.handler) => void

		port: number

		/**
		 * A client that proxies all requests through this object.
		 */
		client: slime.jrunscript.http.client.object.Client

		https: {
			port: number
			client: slime.jrunscript.http.client.object.Client
		}

		/** the environment to use when launching a process that proxies through this mock internet; sets http_proxy variable */
		environment: object

		hg: {
			/** an object that describes the Mercurial configuration needed for Mercurial to use this mock internet. */
			config: object
		}

		start: () => void
		run: () => void
		stop: () => void
	}

	//	TODO	the old tests and new HTTPS tests are duplicative; merge them

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var jsh = fifty.global.jsh;

			fifty.tests.old = function() {
				fifty.verify("mock").is("mock");
				if (!jsh.unit.mock.Web) return;

				var web = new jsh.unit.mock.Web({ trace: true });
				web.addHttpsHost("mockweb.xlime.com");
				web.add(fifty.$loader.module("test/mock-echo-handler.js"));
				web.start();

				//	HTTP interface
				var client = web.client;
				var response = client.request({
					url: "http://mockweb.slime.com/foo-bar-baz"
				});
				var json: { method: string, path: string } = JSON.parse(response.body.stream.character().asString());
				fifty.verify(json).method.is("GET");
				fifty.verify(json).path.is("foo-bar-baz");

				//	HTTPS interface
				fifty.verify(web).https.port.is.type("number");
				var secure = web.https.client;
				try {
					jsh.http.test.disableHttpsSecurity();
					var secured = secure.request({
						url: "https://mockweb.slime.com/foo-bar-baz"
					});
					jsh.shell.console("Success.");
				} catch (e) {
					jsh.shell.console("HTTPS connection");
					jsh.shell.console("tunnel error: " + JSON.stringify({
						type: e.type,
						message: e.message
					}));
				}

				web.stop();
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.https = function() {
				fifty.verify(1).is(1);
				if (!fifty.global.jsh.unit.mock.Web) {
					jsh.shell.console("jsh.unit.mock.Web not present; skipping test.");
					return;
				}
				var web = new fifty.global.jsh.unit.mock.Web();
				web.addHttpsHost("https.fifty.com");
				web.add(function(request) {
					return {
						status: { code: 200 },
						body: {
							type: "application/json",
							string: JSON.stringify({
								scheme: request.scheme,
								method: request.method,
								host: request.headers.value("Host"),
								path: request.path
							})
						}
					}
				});
				web.start();

				var client = web.https.client;
				fifty.global.jsh.http.test.disableHttpsSecurity();

				var response = client.request({
					url: "https://https.fifty.com/foo/bar"
				});
				var json = response.body.stream.character().asString();
				var body: { scheme: string, method: string, host: string, path: string } = JSON.parse(json);
				fifty.verify(body).scheme.is("https");
				fifty.verify(body).method.is("GET");
				fifty.verify(body).host.is("https.fifty.com");
				fifty.verify(body).path.is("foo/bar");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.jsapi = function() {
				if (jsh.unit.mock.Web) {
					var web = new jsh.unit.mock.Web();
					web.add(function(request) {
						if (request.headers.value("host") == "www.foo.com") {
							return {
								status: { code: 200 },
								body: {
									type: "application/json",
									string: JSON.stringify({ path: request.path })
								}
							}
						}
					});
					web.start();
					var client = web.client;
					var response: { path: string } = client.request({
						url: "http://www.foo.com/pathis",
						evaluate: function(response) {
							if (response.status.code != 200) {
								throw new Error();
							}
							return JSON.parse(response.body.stream.character().asString());
						}
					});
					verify(response).path.is("pathis");
					web.stop();
				}
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.old);
				fifty.run(fifty.tests.https);
				fifty.run(fifty.tests.jsapi);
			}
		}
	//@ts-ignore
	)(fifty);
}
