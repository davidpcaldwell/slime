//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export interface mock {
		Web: mock.web.Constructor
		Internet: any
		Hg: any
		git: any
	}

	export namespace mock {
		export type handler = slime.servlet.handler & { stop?: () => void }

		export namespace web {
			export namespace constructor {
				export type Function = new (o?: {
					trace: boolean
				}) => slime.jsh.unit.mock.Web
			}

			export type Constructor = constructor.Function & {
				bitbucket: (o: {}) => handler
				github: (o: { src: slime.jsh.unit.mock.github.src, private?: boolean }) => handler
			}
		}

		export interface Web {
			addHttpsHost: (host: string) => void

			/** adds a handler that can supply parts of the mock internet */
			add: (handler: jsh.unit.mock.handler) => void

			port: number

			/** described on definition page */
			client: slime.jrunscript.http.client.Client

			/** described on definition page */
			jrunscript: Function

			https: {
				port: number
				client: slime.jrunscript.http.client.Client
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
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.old = function() {
					fifty.verify("mock").is("mock");

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
				fifty: slime.fifty.test.kit
			) {
				fifty.tests.https = function() {
					fifty.verify(1).is(1);
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

	}
}

(
	function(
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.suite = function() {
			fifty.run(fifty.tests.old);
			fifty.run(fifty.tests.https);
		}
	}
//@ts-ignore
)(fifty);
