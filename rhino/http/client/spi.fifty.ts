//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.http.client.spi {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.types = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace request {
		export interface Body {
			type: slime.mime.Type
			stream: slime.jrunscript.runtime.io.InputStream
		}
	}

	export interface Argument {
		request: {
			method: string
			url: slime.web.Url
			headers: Header[]
			body?: request.Body
		}
		proxy?: Proxies
		timeout: Timeouts
	}

	export type Implementation = slime.$api.fp.world.Sensor<Argument,Events,Response>

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.types.Implementation = function(subject: Implementation) {
				var server = jsh.httpd.Tomcat();
				server.servlet({
					load: function(scope) {
						scope.$exports.handle = function(request) {
							return {
								status: { code: 200 },
								body: {
									type: "application/json",
									string: JSON.stringify({
										path: request.path
									})
								}
							}
						}
					}
				});
				server.start();
				var ask = $api.fp.world.input(subject({
					request: {
						method: "GET",
						url: jsh.web.Url.codec.string.decode("http://127.0.0.1:" + server.port + "/foo"),
						headers: []
					},
					timeout: void(0)
				}));
				var response = ask();
				verify(response).status.code.is(200);
				var body: { path: string } = JSON.parse(response.stream.character().asString());
				verify(body).path.is("foo");
				server.stop();
			}
		}
	//@ts-ignore
	)(fifty);


	export namespace old {
		export interface Request {
			method: string
			url: slime.web.Url
			headers: Header[]
			body: client.request.Body
			proxy: Proxies
			timeout: Timeouts
		}

		export type implementation = (p: Request) => Response
	}
}
