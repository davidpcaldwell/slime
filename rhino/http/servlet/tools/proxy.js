//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.servlet.proxy.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.servlet.proxy.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
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
		 * @type { slime.servlet.proxy.internal.https }
		 *
		 * Creates a local HTTPS configuration, allowing HTTPS applications or tests to be run against a local HTTPS server.
		 * The implementation creates a local HTTPS certificate store containing certificates for the given hosts.
		 *
		 * @param p
		 * @returns A value for the `https` property of {@link slime.jsh.httpd.tomcat.Configuration}.
		 */
		function https(p) {
			var pkcs12 = mkcert(["127.0.0.1"].concat(p.hosts)).pathname;

			var port = $context.library.ip.getEphemeralPort().number;
			return {
				port: port,
				keystore: {
					file: pkcs12.file,
					password: "changeit"
				}
			}
		}

		/**
		 *
		 * @param { slime.servlet.proxy.Server } p
		 */
		function createHttpServer(p) {
			var tomcat = $context.library.jsh.httpd.Tomcat({
				https: https({
					hosts: p.hosts
				})
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
									scheme: "http"
								}
							);
							return $context.library.web.Url.codec.string.encode(url);
						})(request.url);

						/** @type { slime.jrunscript.http.client.spi.Argument } */
						var send = {
							request: {
								method: request.method,
								url: $context.library.web.Url.codec.string.decode(url),
								headers: $api.Array.build(function(rv) {
									rv.push.apply(rv, request.headers.filter(function(header) {
										var name = header.name.toLowerCase();
										//	TODO	test to see whether host has any effect
										if (name == "host") return false;
										if (name == "connection") return false;
										if (name == "upgrade-insecure-requests") return false;
										return true;
									}));
									rv.push({ name: "X-Forwarded-Proto", value: request.url.scheme });
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
							headers: send.request.headers,
							proxy: {
								http: {
									host: "127.0.0.1",
									port: p.delegate.port
								}
							},
							body: {
								type: send.request.body.type,
								read: (function() {
									var buffer = new Packages.java.io.ByteArrayOutputStream();
									$context.library.io.Streams.binary.copy(
										send.request.body.stream,
										buffer
									);
									return {
										binary: function() {
											var _input = new Packages.java.io.ByteArrayInputStream(buffer.toByteArray());
											return $context.library.io.InputStream.old.from.java(_input);
										}
									};
								})()
							},
							on: {
								redirect: function(p) {
									p.response.headers.forEach(function(header) {
										if (header.name == "Location") {
											console("-------------------------------")
											console("Location: " + header.value);
											console("-------------------------------")
										}
									});
									console("Next: " + p.next.method + " " + $context.library.web.Url.codec.string.encode(p.next.url));
									p.next = null;
								}
							}
						}

						var client = new $context.library.http.Client({
							TREAT_302_AS_303: true
						});

						console("PROXY requesting via object: " + argument.url);
						var object = client.request(argument);

						//	TODO	for some reason the world-oriented HTTP client does not work here, hence the commented-out
						//			code; it hangs for both internal clients and browser clients

						//	TODO	could try world-oriented client again now that object-oriented client is working correctly

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
							}).map(function(header) {
								if (header.name == "Location") {
									console("===============================");
									console("Location: " + header.value);
									console("port = " + p.delegate.port);
									console("===============================");
									if (p.override && p.override.redirect) {
										header.value = p.override.redirect({
											request: request,
											location: header.value
										})
									} else {
										//	By default we simply make all location headers https rather than http
										var url = $context.library.web.Url.codec.string.decode(header.value);
										if (url.scheme == "http") url.scheme = "https";
										header.value = $context.library.web.Url.codec.string.encode(url);
									}
								}
								return header;
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
			server: createHttpServer,
			application: function(p) {
				var tomcat = createHttpServer(p);
				$context.library.java.Thread.start(function() {
					try {
						tomcat.run();
					} catch (e) {
						console(e);
						console(e.stack);
					}
				});

				var pac = $loader.get("proxy.pac").read(String)
					.replace(/__HTTP__/g, String(p.delegate.port))
				;

				console("HTTP running on " + p.delegate.port);
				console("HTTPS running on " + tomcat.https.port);

				var instance = new $context.library.jsh.shell.browser.chrome.Instance({
					location: p.chrome.location,
					proxy: $context.library.jsh.shell.browser.ProxyConfiguration({
						code: pac
					}),
					hostrules: p.hosts.map(function(host) {
						return "MAP " + host + " " + "127.0.0.1:" + tomcat.https.port;
					})
				});

				instance.run({
					uri: p.chrome.uri
				});
			}
		})
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export);
