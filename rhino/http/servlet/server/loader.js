//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.servlet.internal.server.loader.Context } $context
	 * @param { slime.loader.Export<slime.servlet.internal.server.loader.Export> } $export
	 */
	function($context,$export) {
		/** @type { slime.servlet.internal.server.loader.Export } */
		var $exports = {};
		$exports.Request = {
			host: function(request) {
				var header = request.headers.value("host");
				return header;
			}
		}
		$exports.http = {
			Response: void(0)
		};

		/**
		 *
		 * @param { number } code
		 * @param { string } location
		 * @returns { slime.servlet.Response }
		 */
		var redirect = function(code,location) {
			return {
				status: { code: code },
				headers: [
					{
						name: "Location",
						value: location
					}
				]
			};
		}

		$exports.http.Response = {
			text: function(string) {
				return {
					status: {
						code: 200
					},
					headers: [],
					body: {
						type: "text/plain",
						string: string
					}
				};
			},
			resource: function(body) {
				return {
					status: { code: 200 },
					body: body
				};
			},
			NOT_FOUND: function() {
				return {
					status: {
						code: 404
					}
				}
			},
			SEE_OTHER: function(p) {
				return redirect(303, p.location);
			},
			TEMPORARY_REDIRECT: function(p) {
				return redirect(307, p.location);
			},
			javascript: function(p) {
				if (typeof(p) == "string") {
					return {
						status: { code: 200 },
						body: {
							type: "text/javascript",
							string: p
						}
					}
				} else {
					throw new Error("'p' must be string");
				}
			},
			/** @type { slime.servlet.httpd["http"]["Response"]["cookie"] } */
			cookie: function(p) {
				var name = "Set-Cookie";
				var tokens = [
					p.name + "=" + p.value
				];
				if (p.expires) tokens.push("Expires=" + p.expires.toUTCString());
				if (p.maxAge) tokens.push("Max-Age=" + p.maxAge);
				if (p.domain) tokens.push("Domain=" + p.domain);
				if (p.path) tokens.push("Path=" + p.path);
				if (p.secure) tokens.push("Secure");
				if (p.httpOnly) tokens.push("HttpOnly");
				if (p.sameSite) tokens.push("SameSite=" + p.sameSite);
				return { name: name, value: tokens.join("; ") };
			}
		};

		$exports.Handler = Object.assign(function(p) {
			throw new Error("Reserved for future use.");
		}, {
			Child: void(0),
			series: void(0),
			HostRedirect: void(0),
			Proxy: void(0),
			Loader: void(0),
			content: void(0)
		});
		$exports.Handler.series = function() {
			var delegates = arguments;
			return function(request) {
				for (var i=0; i<delegates.length; i++) {
					var handler = (function(argument) {
						if (typeof(argument) == "object") {
							throw new TypeError("argument to Handler.series must not be object.");
							//	Not sure what the below was
							//	return new $exports.Handler(argument);
						} else if (typeof(argument) == "function") {
							return argument;
						}
					})(delegates[i]);
					var rv = handler(request);
					if (typeof(rv) != "undefined") return rv;
				}
			}
		};
		$exports.Handler.Child = function(p) {
			if (typeof(p.filter) == "object" && p.filter instanceof RegExp) {
				return function(request) {
					var match = p.filter.exec(request.path);
					if (match) {
						var req = Object.assign({}, request, {
							path: match[1]
						});
						return p.handle(req);
					}
				};
			}
		};
		$exports.Handler.HostRedirect = function(p) {
			var redirect = function(url) {
				return {
					status: { code: 301 },
					headers: [
						{ name: "Location", value: url.toString() }
					]
				};
			};

			return function(request) {
				if (request.headers.value("host") == p.from) {
					//	TODO	allow p.to to to have host/path/port?
					var to = new $context.api.web.Url({
						scheme: "http",
						authority: {
							host: p.to
							//	port
							//	userinfo
						},
						path: "/" + request.path
						//	TODO	query
						//	TODO	fragment: is this even possible?
					});
					return redirect(to);
				}
			}
		};
		$exports.Handler.Proxy = function(o) {
			var client = o.client;

			return function(request) {
				//	TODO	what about protocol? What about host header?
				var path = (request.query) ? request.path + "?" + request.query.string : request.path;
				var target = (function() {
					if (request.scheme == "http") return o.target;
					if (request.scheme == "https") return o.https;
				})();
				var send = {
					method: request.method,
					url: request.scheme + "://" + target.host + ":" + target.port + "/" + path,
					headers: request.headers,
					body: (request.method == "GET") ? void(0) : request.body
				};
				var response = client.request(send);
				var get = response.headers.get;
				response.headers = Object.assign(response.headers.filter(function(header) {
					var name = header.name.toLowerCase();
					if (name == "transfer-encoding") return false;
					return true;
				}), { get: get });
				return response;
			};
		};
		$exports.Handler.Loader = function(o) {
			return function(request) {
				if (request.method == "GET") {
					var path = (function(path,index) {
						if (path) return path;
						if (index) return index;
						return path;
					})(request.path, o.index)
					var resource = o.loader.get(path);
					if (resource) {
						return $exports.http.Response.resource(resource);
					} else if (resource === null) {
						return null;
					}
				}
			};
		}
		$export($exports);
	}
//@ts-ignore
)($context,$export);
