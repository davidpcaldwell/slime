//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME servlet interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//@ts-check
(
	/**
	 * @param { { api: { web: slime.web.Exports, http: slime.jrunscript.http.client.Exports }} } $context
	 * @param { { http: slime.servlet.httpd["http"], Handler: slime.servlet.httpd["Handler"] } } $exports
	 */
	function($context,$exports) {
		$exports.http = {
			Response: void(0)
		};

		$exports.http.Response = Object.assign(function() {
			throw new Error("Reserved for future use.");
		}, {
			text: void(0),
			resource: void(0),
			NOT_FOUND: void(0),
			SEE_OTHER: void(0),
			javascript: void(0)
		});

		$exports.http.Response.text = function(string) {
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
		};

		$exports.http.Response.javascript = function(p) {
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
		}

		$exports.http.Response.resource = function(body) {
			return {
				status: { code: 200 },
				body: body
			};
		};

		$exports.http.Response.NOT_FOUND = function() {
			return {
				status: {
					code: 404
				}
			}
		};

		$exports.http.Response.SEE_OTHER = function(p) {
			var rv = {
				status: { code: 303 },
				headers: [
					{ name: "Location", value: p.location }
				]
			};
			return rv;
		}

		$exports.Handler = Object.assign(function(p) {
			throw new Error("Reserved for future use.");
		}, {
			Child: void(0),
			series: void(0),
			HostRedirect: void(0),
			Proxy: void(0),
			Loader: void(0)
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
			var redirect = function(url,parameters) {
				//	TODO	this is terrible, ignores parameters
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
					return redirect(to, request.parameters);
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
						/**
						 *
						 * @param { slime.Resource } resource
						 * @returns { resource is slime.jrunscript.runtime.Resource }
						 */
						var isJrunscriptResource = function(resource) {
							return true;
						}
						//	TODO	investigate whether there's a better way to do this type stuff than "casting"
						//	TODO	maybe there's a flaw in the type definitions downstream, or maybe we need a type of loader
						//			that returns jrunscript resources always
						if (isJrunscriptResource(resource)) {
							return $exports.http.Response.resource(resource);
						} else {
							throw new Error("Unreachable.");
						}
					} else if (resource === null) {
						return null;
					}
				}
			};
		}
	}
//@ts-ignore
)($context,$exports);
