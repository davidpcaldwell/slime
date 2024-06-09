//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.shell.browser.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.shell.browser.Exports } $exports
	 */
	function($context,$loader,$exports) {
		var code = {
			/** @type { slime.jrunscript.shell.browser.internal.chrome.Script } */
			chrome: $loader.script("chrome.js")
		};

		var library = {
			chrome: code.chrome($context)
		};

		//	TODO	tighten dependencies?
		$exports.chrome = library.chrome.installed;

		$exports.Chrome = {
			getMajorVersion: library.chrome.getMajorVersion
		}

		$exports.installed = {
			chrome: library.chrome.installed
		};

		/** @type { slime.jrunscript.shell.browser.exports.ProxyConfiguration } */
		var ProxyConfiguration = {
			from: {
				port: function(port) {
					return $loader.get("port.pac.js").read(String).replace(/__PORT__/g, String(port));
				},
				host: function(host) {
					return function(port) {
						return $loader.get("hostToPort.pac.js").read(String).replace(/__HOST__/g, host).replace(/__PORT__/g, String(port));
					}
				}
			},
			Server: function(pac) {
				var pacserver = $context.api.httpd.tomcat.Server.from.configuration({
					webapp: $context.api.httpd.servlet.Servlets.from.root({
						resources: void(0),
						servlet: {
							load: function(scope) {
								scope.$exports.handle = function(request) {
									var response = {
										status: { code: 200 },
										body: {
											type: "application/x-javascript-config",
											string: pac
										}
									};

									if (request.path == "proxy.pac") {
										return response;
									}
								}
							}
						}
					})
				});

				pacserver.start();

				return {
					url: "http://127.0.0.1:" + pacserver.port + "/proxy.pac",
					stop: function() {
						pacserver.stop();
					}
				};
			}
		};

		$exports.ProxyConfiguration = Object.assign(
			function(o) {
				var pac = (function() {
					if (o && o.code) return o.code;
					if (o && o.pac) return o.pac;
					if (!o || typeof(o.port) != "number") throw new TypeError("Required: port (number)");
					return ProxyConfiguration.from.port(o.port);
				})();

				/** @type { slime.servlet.Response } */
				var response = {
					status: { code: 200 },
					body: {
						type: "application/x-javascript-config",
						string: pac
					}
				};

				return {
					Server: ($context.api.httpd.Tomcat) ? function() {
						var pacserver = $context.api.httpd.Tomcat();
						var url = "http://127.0.0.1:" + pacserver.port + "/proxy.pac";
						pacserver.map({
							path: "/",
							servlets: {
								"/*": {
									load: function(scope) {
										scope.$exports.handle = function(request) {
											if (request.path == "proxy.pac") {
												return response;
											}
										}
									}
								}
							}
						});
						return {
							url: url,
							start: function() {
								pacserver.start();
							},
							stop: function() {
								pacserver.stop();
							}
						};
					} : void(0),
					code: pac,
					response: response
				};
			},
			{
				Server: void(0)
			},
			ProxyConfiguration
		);
	}
//@ts-ignore
)($context,$loader,$exports);
