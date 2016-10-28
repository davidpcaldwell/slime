//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$exports.inject = function(p) {
	$context.api.httpd = p.httpd;
}

//	TODO	tighten dependencies?
$exports.chrome = $loader.file("chrome.js", $context).chrome;

$exports.ProxyConfiguration = function(o) {
	var pac = (function() {
		if (o && o.code) return o.code;
		if (o && o.pac) return o.pac;
		if (!o || typeof(o.port) != "number") throw new TypeError("Required: port (number)");
		return $loader.get("proxy.pac.js").read(String).replace(/__PORT__/g, String(o.port));
	})();

	var response = {
		status: { code: 200 },
		body: {
			type: "application/x-javascript-config",
			string: pac
		}
	};

	return {
		Server: function() {
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
		},
		code: pac,
		response: response
	};
};
$exports.ProxyConfiguration.Server = function(p) {
	var proxy = new $exports.ProxyConfiguration(p);
	return proxy.Server();
}
