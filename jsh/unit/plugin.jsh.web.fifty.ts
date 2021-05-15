//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.unit {
	export interface mock {
		Web: mock.Web.constructor
		Internet: any
		Hg: any
		git: any
	}

	export namespace mock {
		export type handler = slime.servlet.handler & { stop?: () => void }

		export namespace Web {
			namespace constructor {
				export type Function = new (o?: {
					trace: boolean
				}) => slime.jsh.unit.mock.Web
			}

			export type constructor = constructor.Function & {
				bitbucket: (o: {}) => handler
				github: (o: { src: slime.jsh.unit.mock.github.src, private?: boolean }) => handler
			}
		}

		export interface Web {
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

		(
			function(
				fifty: slime.fifty.test.kit
			) {
				var jsh = fifty.global.jsh;

				fifty.tests.suite = function() {
					fifty.verify("mock").is("mock");

					var web = new jsh.unit.mock.Web({ trace: true });
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

					//	Try to tunnel
					try {
						var secured = client.request({
							url: "https://mockweb.slime.com/foo-bar-baz"
						});
					} catch (e) {
						jsh.shell.console("tunnel");
						jsh.shell.console("tunnel error: " + JSON.stringify({
							type: e.type,
							message: e.message
						}));
					}

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
	}
}
