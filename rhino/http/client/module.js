//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the rhino/http/client SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

if (!$context.api) {
	throw new TypeError("Missing $context.api");
}
if (!$context.api.js) {
	throw new TypeError("Missing $context.api.js");
}
if (!$context.api.io) {
	throw new TypeError("Missing $context.api.io");
}

//	TODO	Pretty much all this does currently is log "Requesting:" followed by the URL being requested; should document and make
//			this much more advanced; probably should configure at instance level, not module level
var debug = ($context.debug) ? $context.debug : function(){};

var Cookies = function() {
	if ($context.gae) {
		var cookies = [];

		this.toString = function() {
			return "Cookies: " + $context.api.js.toLiteral(cookies);
		};

		this.set = function(url,headers) {
			var sets = headers.filter( function(header) {
				return header.name.toLowerCase() == "set-cookie";
			});
			sets.forEach( function(header) {
				var trim = function(str) {
					return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				}

				var parts = header.value.split(";");
				var nvp = parts[0];
				var cookie = {};
				cookie.name = nvp.split("=")[0];
				cookie.value = nvp.split("=").slice(1).join("=");
				var jurl = new Packages.java.net.URL(url);
				cookie.domain = String(jurl.getHost());
				cookie.path = String(jurl.getPath());
				parts.slice(1).forEach( function(part) {
					part = trim(part);
					if (part == "httponly") {
						cookie.httponly = true;
					} else if (part == "Secure") {
						cookie.secure = true;
					} else {
						var attribute = part.split("=")[0].toLowerCase();
						attribute = trim(attribute);
						var value = part.split("=")[1];
						value = trim(value);
						if (attribute == "expires") {
							cookie.expires = value;
						} else if (attribute == "max-age") {
							cookie.maxage = value;
						} else if (attribute == "domain") {
							cookie.domain = value;
						} else if (attribute == "path") {
							cookie.path = value;
						}
					}
				});
				//	put cookie at front of list so it automatically supersedes older ones
				cookies.unshift(cookie);
			})
		}

		this.get = function(url,headers) {
			//	TODO	obviously this does not work, but passes current unit tests because no cookies are apparently needed for
			//			the Google module, which is the only module that uses the gae implementation currently
			//	TODO	obviously this overincludes cookies
			cookies.forEach( function(cookie) {
				headers.push({ name: "Cookie", value: cookie.name + "=" + cookie.value });
			});
		}
	} else {
		var peer = new Packages.java.net.CookieManager();
		peer.setCookiePolicy(Packages.java.net.CookiePolicy.ACCEPT_ALL);

		var toMap = function(headers) {
			var rv = new Packages.java.util.HashMap();
			headers.forEach(function(header) {
				if (!rv.get(header.name)) {
					rv.put(header.name,new Packages.java.util.ArrayList());
				}
				rv.get(header.name).add(header.value);
			});
			return rv;
		}

		var fromMap = function(cookies,headers) {
			var i = cookies.keySet().iterator();
			while(i.hasNext()) {
				var $name = i.next();
				var $values = cookies.get($name);
				var name = String($name);
				var j = $values.iterator();
				while(j.hasNext()) {
					headers.push({ name: name, value: String(j.next()) });
				}
			}
		}

		this.toString = function() {
			return peer.getCookieStore().getCookies().toString();
		}

		this.set = function(url,headers) {
			peer.put(new Packages.java.net.URI(url),toMap(headers));
		}

		this.get = function(url,headers) {
			var cookies = peer.get(new Packages.java.net.URI(url),toMap(headers));
			fromMap(cookies,headers);
		}
	}
};

var QueryString = function(string) {
	var decode = function(string) {
		return String(Packages.java.net.URLDecoder.decode(string, "UTF-8"));
	}

	var pairs = string.split("&").map( function(token) {
		var assign = token.split("=");
		return { name: decode(assign[0]), value: decode(assign[1]) };
	});

	return pairs;
}
QueryString.encode = function(array) {
	var encode = function(string) {
		return String(Packages.java.net.URLEncoder.encode(string, "UTF-8"));
	}

	return array.map( function(item) {
		return encode(item.name) + "=" + encode(item.value);
	}).join("&");
};

var Url = function(string) {
	if (string.indexOf("?") == -1) {
		this.url = string;
		this.parameters = [];
	} else {
		this.url = string.split("?")[0];
		this.parameters = new QueryString(string.split("?").slice(1).join("?"));
	}

	this.toString = function() {
		var rv = this.url;
		if (this.parameters.length) {
			rv += "?" + QueryString.encode(this.parameters);
		}
		return rv;
	}
}

var Parameters = function(p) {
	if (typeof(p) == "object" && p.forEach) {
		return p;
	} else if (typeof(p) == "object") {
		var rv = [];
		for (var x in p) {
			if (typeof(p[x]) == "string") {
				rv.push({ name: x, value: p[x] });
			} else if (typeof(p[x]) == "number") {
				rv.push({ name: x, value: String(p[x]) });
			} else if (typeof(p[x]) == "object" && p[x].forEach) {
				p[x].forEach( function(item) {
					rv.push({ name: x, value: item });
				});
			} else {
				throw new TypeError("Illegal argument to Parameters: property " + x + ": " + p[x]);
			}
		}
		return rv;
	} else {
		throw new TypeError("Illegal argument to Parameters: " + p);
	}
}

Url.Query = function(p) {
	if (typeof(p) == "string") {
		return new QueryString(p);
	} else {
		return new Parameters(p);
	}
}

var Client = function(mode) {
	var cookies = new Cookies();

	var connect = function(method,url,headers,mode) {
		var $url = new Packages.java.net.URL(url);
		debug("Requesting: " + url);
		var $urlConnection = (function(proxy) {
			if (!proxy) {
				return $url.openConnection();
			} else if (proxy.http || proxy.socks) {
				var _type = (function() {
					if (proxy.http) return {
						type: Packages.java.net.Proxy.Type.HTTP,
						specifier: proxy.http
					}
					if (proxy.socks) return {
						type: Packages.java.net.Proxy.Type.SOCKS,
						specifier: proxy.socks
					};
					throw new Error("Unrecognized proxy type in " + proxy);
				})();
				var _proxy = new Packages.java.net.Proxy(
					_type.type,
					new Packages.java.net.InetSocketAddress(_type.specifier.host,_type.specifier.port)
				);
				return $url.openConnection(_proxy);
			}
		})(mode.proxy);
		$urlConnection.setRequestMethod(method);
		if (mode && mode.timeout) {
			if (mode.timeout.connect) {
				$urlConnection.setConnectTimeout(mode.timeout.connect);
			}
			if (mode.timeout.read) {
				$urlConnection.setReadTimeout(mode.timeout.read);
			}
		}
		cookies.get(url,headers);
		headers.forEach( function(header) {
			$urlConnection.addRequestProperty(header.name,header.value);
		});
		$urlConnection.setInstanceFollowRedirects(false);
		return $urlConnection;
	}

	var getStatus = function($urlConnection) {
		return {
			code: Number($urlConnection.getResponseCode()),
			message: ($urlConnection.getResponseMessage()) ? String($urlConnection.getResponseMessage()) : function(){}()
		}
	}

	var getHeaders = function($urlConnection) {
		var headers = [];
		var more = true;
		var i = 1;
		while(more) {
			var name = $urlConnection.getHeaderFieldKey(i);
			if (name != null) {
				var value = $urlConnection.getHeaderField(i);
				headers.push({name: String(name), value: String(value)});
			} else {
				more = false;
			}
			i++;
		}
		cookies.set(String($urlConnection.getURL().toExternalForm()),headers);

		headers.get = function(name) {
			var values = this
				.filter(function(header) { return header.name.toUpperCase() == name.toUpperCase() })
				.map(function(header) { return header.value; })
			;
			if (values.length == 0) return null;
			if (values.length == 1) return values[0];
			return values;
		}
		return headers;
	}

	this.request = function(p) {
		var method = (p.method) ? p.method.toUpperCase() : "GET";
		if (p.params && !p.parameters) {
			p.parameters = p.params;
			delete p.params;
		}
		var url = new Url(p.url);
		if (p.parameters) {
			url.parameters = url.parameters.concat(new Url.Query(p.parameters));
		}
		var headers = (p.headers) ? new Parameters(p.headers) : [];
		var $urlConnection = connect(method,url.toString(),headers,{ proxy: p.proxy, timeout: p.timeout });
		if (p.body) {
			$urlConnection.setDoOutput(true);
			if (p.body.type) {
				$urlConnection.setRequestProperty("Content-Type", p.body.type);
			} else {
				//	TODO	Would be more accurate to remove the content type, but this does not seem to work; seems to default
				//			to application/x-www-form-urlencoded
				$urlConnection.setRequestProperty("Content-Type", "application/octet-stream");
			}

			//	TODO	Does not handle stream/$stream from rhino/mime
			if (typeof(p.body.string) != "undefined") {
				var writer = $context.api.io.java.adapt($urlConnection.getOutputStream()).character();
				writer.write(p.body.string);
				writer.close();
			} else if (p.body.stream) {
				$context.api.io.Streams.binary.copy(p.body.stream,$urlConnection.getOutputStream());
				$urlConnection.getOutputStream().close();
			} else {
				throw "Unimplemented: no p.body.string or p.body.stream";
			}
		}
		var status = getStatus($urlConnection);
		var headers = getHeaders($urlConnection);

		var isRedirect = function(status) {
			return (status.code >= 300 && status.code <= 303) || status.code == 307;
		}

		if (isRedirect(status)) {
			var URI = Packages.java.net.URI;
			var redirectTo = headers.get("Location");
			if (!redirectTo) throw new Error("Redirect without location header.");
			redirectTo = String( new URI(url.url).resolve(new URI(redirectTo)).normalize().toString() );
			var redirectUrl = new Url(redirectTo);
			//	TODO	copy object rather than modifying
			var rv = {};
			for (var x in p) {
				//	Treating 302 as 303, as many user agents do that; see discussion in RFC 2616 10.3.3
				//	TODO	document this, perhaps after designing mode to be more general
				var TREAT_302_AS_303 = (mode && mode.TREAT_302_AS_303);
				var IS_303 = (TREAT_302_AS_303) ? (status.code == 302 || status.code == 303) : status.code == 303;
				if (x == "method" && IS_303) {
					rv.method = "GET";
				} else if (x == "body" && IS_303) {
					//	leave body undefined
				} else {
					rv[x] = p[x];
				}
			}
			rv.url = redirectUrl.url;
			rv.parameters = redirectUrl.parameters;
			if (p.on && p.on.redirect) {
				p.on.redirect({ url: rv.url, parameters: rv.parameters });
			}
			//	rv.body is undefined
			return arguments.callee(rv);
		} else {
			var parser = (p.parse) ? p.parse : function(response) {
				return response;
			};
			try {
				var $input = $urlConnection.getInputStream();
			} catch (e) {
				var $error = $urlConnection.getErrorStream();
			}
			var result = ($input) ? $input : $error;
			return parser({
				request: p,
				status: status,
				headers: headers,
				body: {
					type: headers.get("Content-Type"),
					stream: (result) ? $context.api.io.java.adapt(result) : null
				}
			});
		}
	}
}

$exports.Client = Client;

$exports.Body = new function() {
	this.Form = function(p) {
		return {
			type: "application/x-www-form-urlencoded",
			string: QueryString.encode(new Url.Query(p))
		};
	}
}

$exports.Parser = new function() {
	this.OK = function(f) {
		return function(response) {
			if (response.status.code != 200) {
				var error = new Error("HTTP Status code: " + response.status.code + " message=" + response.status.message);
				error.page = response.body.stream.character().asString();
				throw error;
			}
			return f(response);
		}
	}
}

$exports.Loader = function(client) {
	this.getCode = function(url) {
		client.request({
			url: url,
			parse: function(response) {
				if (response.status.code == 200) {
					return {
						name: url,
						_in: response.body.stream.java.adapt()
					};
				} else {
					throw new Error("Not found: " + url);
				}
			}
		});
	}
};
