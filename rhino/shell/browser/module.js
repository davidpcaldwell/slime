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
		$exports.inject = function(p) {
			$context.api.httpd = p.httpd;
		}

		//	TODO	tighten dependencies?
		$exports.chrome = $loader.module("chrome.js", $context);

		$exports.ProxyConfiguration = function(o) {
			var pac = (function() {
				if (o && o.code) return o.code;
				if (o && o.pac) return o.pac;
				if (!o || typeof(o.port) != "number") throw new TypeError("Required: port (number)");
				return $loader.get("proxy.pac.js").read(String).replace(/__PORT__/g, String(o.port));
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
					//	TODO	should allow omission of empty argument
					var pacserver = new $context.api.httpd.Tomcat({});
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
		};
		Object.defineProperty($exports.ProxyConfiguration,"Server",{
			get: function() {
				return ($context.api.httpd && $context.api.httpd.Tomcat) ? function(p) {
					var proxy = $exports.ProxyConfiguration(p);
					return proxy.Server();
				} : void(0);
			}
		});
	}
//@ts-ignore
)($context,$loader,$exports);
