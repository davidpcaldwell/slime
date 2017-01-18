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

$exports.http = {};

$exports.http.Response = function() {
	throw new Error("Reserved for future use.");
};

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

$exports.http.Response.NOT_FOUND = function() {
	return {
		status: {
			code: 404
		}
	}
};

$exports.Handler = function(p) {
	throw new Error("Reserved for future use.");
};
$exports.Handler.series = function() {
	var delegates = arguments;
	return function(request) {
		for (var i=0; i<delegates.length; i++) {
			var handler = (function(argument) {
				if (typeof(argument) == "object") {
					return new $exports.Handler(argument);
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
				var req = request;
				for (var x in request) {
					req[x] = request[x];
				}
				req.path = match[1];
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
	var client = new jsh.http.Client();
	
	return function(request) {
		//	TODO	what about protocol? What about host header?
		var path = (request.query) ? request.path + "?" + request.query.string : request.path;
		var send = {
			method: request.method,
			url: "http://" + o.target.host + ":" + o.target.port + "/" + path,
			headers: request.headers,
			body: (request.method == "GET") ? void(0) : request.body
		};
		var response = client.request(send);
		response.headers = response.headers.filter(function(header) {
			var name = header.name.toLowerCase();
			if (name == "transfer-encoding") return false;
			return true;
		});
		return response;
	};
}
