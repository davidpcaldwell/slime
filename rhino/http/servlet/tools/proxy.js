//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.servlet.proxy.Context } $context
	 * @param { slime.loader.Export<slime.servlet.proxy.Exports> } $export
	 */
	function($api,$context,$export) {
		var console = function(message) {
			$context.library.jsh.shell.console(message);
		}

		/**
		 *
		 * @param { string[] } hosts
		 */
		function mkcert(hosts) {
			var mkcert = $context.library.jsh.shell.tools.mkcert.require();
			var pkcs12 = $context.library.jsh.shell.TMPDIR.createTemporary({ suffix: ".p12" });
			mkcert.pkcs12({ hosts: hosts, to: pkcs12.pathname });
			return pkcs12;
		}

		/**
		 *
		 * @param { slime.servlet.proxy.Configuration } p
		 */
		function createHttpServer(p) {
			var hosts = p.hosts;
			var pkcs12 = mkcert(hosts).pathname;

			var port = $context.library.ip.getEphemeralPort().number;
			var tomcat = new $context.library.jsh.httpd.Tomcat({
				https: {
					port: port,
					keystore: {
						file: pkcs12.file,
						password: "changeit"
					}
				}
			});
			tomcat.servlet({
				load: function(scope) {
					//	Our HTTP *client* does not like the id-management-ui node *server*'s HTTPS
					//	Asking for scheme/host/port: https://local.spredfast.com:8086/scripts/main.js
					//	JavaException: javax.net.ssl.SSLHandshakeException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
					// jsh.http.test.disableHttpsSecurity();

					// var getScheme = function(host) {
					// 	if (host == "devbox.spredfast.com") return "https";
					// }

					// var getHost = function(host) {
					// 	if (host.indexOf(":") != -1) host = host.substring(0, host.indexOf(":"));
					// 	return host;
					// }

					scope.$exports.handle = function(request) {
						var url = (function(requested) {
							var url = $api.Object.compose(
								requested,
								{
									scheme: "http",
									host: "127.0.0.1",
									port: p.server.http
								}
							);
							return $context.library.web.Url.codec.string.encode(url);
						})(request.url);

						/** @type { slime.jrunscript.http.client.spi.Argument } */
						var send = {
							request: {
								method: request.method,
								url: url,
								headers: $api.Array.build(function(rv) {
									rv.push.apply(rv, request.headers.filter(function(header) {
										var name = header.name.toLowerCase();
										if (name == "host") return false;
										if (name == "upgrade-insecure-requests") return false;
										return false;
									}));
									// rv.push({ name: "Host", value: request.headers.value("Host")});
								}),
								body: (request.method == "GET" || request.method == "OPTIONS") ? void(0) : {
									type: $context.library.io.mime.Type.codec.declaration.decode(request.headers.value("Content-Type")),
									stream: request.body.stream
								}
							},
							//	TODO	should not be mandatory
							timeout: void(0)
						}

						console(JSON.stringify(send.request.headers,void(0),4));

						/** @type { Parameters<slime.jrunscript.http.client.object.Client["request"]>[0] } */
						var argument = {
							method: send.request.method,
							url: url,
							headers: send.request.headers
							// ,
							// body: send.request.body
						}

						console("PROXY requesting via object: " + argument.url);
						var object = new $context.library.http.Client().request(argument);

						//	TODO	for some reason the world-oriented HTTP client does not work here, hence the commented-out
						//			code; it hangs for both internal clients and browser clients

						// delete send.request.body;
						// jsh.shell.console("PROXY requesting: " + send.request.method + " " + send.request.url);
						// var response = jsh.http.world.request(send)({
						// 	request: function(e) {
						// 		jsh.shell.console("request = " + e.detail);
						// 	}
						// });

						try {
							// var send = {
							// 	method: request.method,
							// 	url: getScheme(host) + "://" + getHost(host) + ":" + getPort(host) + "/" + path,
							// 	headers: request.headers,
							// 	body: (request.method == "GET" || request.method == "OPTIONS") ? void(0) : request.body,
							// 	on: {
							// 		redirect: function(p) {
							// 			jsh.shell.console("Redirect!");
							// 			jsh.shell.console("Request = " + p.request);
							// 			jsh.shell.console("Response = " + p.response);
							// 			p.next = null;
							// 		}
							// 	}
							// };
							// var response = new jsh.http.Client().request(send);

							// response.headers = response.headers.filter(function(header) {
							// 	var name = header.name.toLowerCase();
							// 	if (name == "transfer-encoding") return false;
							// 	return true;
							// });
							object.headers = Object.assign(object.headers.filter(function(header) {
								var name = header.name.toLowerCase();
								if (name == "transfer-encoding") return false;
								return true;
							}), { get: object.headers.get });

							// if (request.method == "OPTIONS") {
							// 	jsh.shell.console("OPTIONS Headers:\n" + response.headers.map(function(header) {
							// 		return header.name + ": " + header.value;
							// 	}).join("\n"));
							// }

							if (request.method == "OPTIONS") {
								console("OPTIONS Headers:\n" + object.headers.map(function(header) {
									return header.name + ": " + header.value;
								}).join("\n"));
							}
							return object;
						} catch (e) {
							console(e);
							console(e.stack);
						}
					}
				}
			});
			tomcat.start();
			return tomcat;
		}

		$export({
			test: {
				mkcert: mkcert
			},
			create: createHttpServer
		})
	}
//@ts-ignore
)($api,$context,$export);
