//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/http/client SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

/**
 * @typedef {Object} slime.jrunscript.http.client.Client
 * @property {Function} request
*/

/**
 * @typedef { new (configuration?: {}) => slime.jrunscript.http.client } slime.jrunscript.http.client.Client.constructor
 */

/**
 * @typedef {Object} slime.jrunscript.http.client
 * @property { slime.jrunscript.http.client.Client.constructor } Client
 */

Packages.java.lang.System.setProperty("sun.net.http.allowRestrictedHeaders", "true");

(function($context) {
	$context.property("api").require();
	$context.property("api","js").require();
	$context.property("api","js").require();
	$context.property("api","java").require();
	$context.property("api","web").require();
})($api.Value($context,"$context"));

var allowMethods = function() {
	var methodsField = $context.api.java.toNativeClass(Packages.java.net.HttpURLConnection).getDeclaredField("methods");

	var modifiersField = $context.api.java.toNativeClass(Packages.java.lang.reflect.Field).getDeclaredField("modifiers");
	modifiersField.setAccessible(true);
	modifiersField.setInt(methodsField, methodsField.getModifiers() & ~Packages.java.lang.reflect.Modifier.FINAL);

	methodsField.setAccessible(true);

	var oldMethods = $context.api.java.Array.adapt(methodsField.get(null));
	var newMethods = oldMethods.concat(Array.prototype.slice.call(arguments));

	methodsField.set(
		null,
		$context.api.java.Array.create({
			type: Packages.java.lang.String,
			array: newMethods.map(function(s) { return new Packages.java.lang.String(s); })
		})
	);
};

allowMethods("PATCH");

//	TODO	Pretty much all this does currently is log "Requesting:" followed by the URL being requested; should document and make
//			this much more advanced; probably should configure at instance level, not module level
var debug = ($context.debug) ? $context.debug : function(){};

var useJavaCookieManager = (function() {
	var getProperty = function(name) {
		var _rv = Packages.java.lang.System.getProperty(name);
		if (_rv) return String(_rv);
		return null;
	}

	if ($context.gae) return false;
	if (getProperty("os.name") == "FreeBSD" && /^1\.6\.0/.test(getProperty("java.version"))) return false;
	return true;
})();

var Cookies = function() {
	if (!useJavaCookieManager) {
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
					//	See http://tools.ietf.org/html/rfc6265#section-5.2.5 and 5.2.6 for documentation on httponly, secure
					if (part.toLowerCase() == "httponly") {
						cookie.httponly = true;
					} else if (part.toLowerCase() == "secure") {
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

var spi = function(p) {
	var connect = function(method,url,headers,mode) {
		if (typeof(url) == "string") url = $context.api.web.Url.parse(url);
		var hostHeader;
		if (url.scheme == "https" && mode.proxy && mode.proxy.https) {
			//	Currently implemented by re-writing the URL; would be better to implement a tunnel through an HTTP proxy but
			//	could not get that working with Tomcat, which returned 400 errors when https requests are sent to http listener
			//	TODO	does this work for default port?
			hostHeader = url.host + ((url.port) ? ":" + url.port : "");
			url.host = mode.proxy.https.host;
			url.port = mode.proxy.https.port;
		}
		var $url = new Packages.java.net.URL(url.toString());
		debug("Requesting: " + url);
		var $urlConnection = (function(proxy) {
			if (!proxy) {
				return $url.openConnection();
			} else if (proxy.https) {
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
		if (hostHeader) {
			$urlConnection.addRequestProperty("Host",hostHeader);
		}
		headers.forEach( function(header) {
			$urlConnection.addRequestProperty(header.name,header.value);
		});
		$urlConnection.setInstanceFollowRedirects(false);
		return $urlConnection;
	}

	var getStatus = function($urlConnection) {
		if ($urlConnection.getResponseCode() == -1) {
			//	used to check for response message here, but at least one extant HTTP server (Stash) omits the OK
			throw new Error("Response was not valid HTTP: " + $urlConnection);
		}
		var rv = {
			code: Number($urlConnection.getResponseCode()),
			reason: String($urlConnection.getResponseMessage())
		};
		return rv;
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
		return headers;
	}

	var $urlConnection = connect(p.method,p.url.toString(),p.headers,{ proxy: p.proxy, timeout: p.timeout });
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
		if (false) {
		} else if (p.body.stream) {
			$context.api.io.Streams.binary.copy(p.body.stream,$urlConnection.getOutputStream());
			$urlConnection.getOutputStream().close();
		} else if (p.body.read && p.body.read.binary) {
			$context.api.io.Streams.binary.copy(p.body.read.binary(),$urlConnection.getOutputStream());
			$urlConnection.getOutputStream().close();
		} else if (typeof(p.body.string) != "undefined") {
			var writer = $context.api.io.java.adapt($urlConnection.getOutputStream()).character();
			writer.write(p.body.string);
			writer.close();
		} else {
			throw new TypeError("A message body must specify its content; no p.body.stream or p.body.string found.");
		}
	}
	try {
		var $input = $urlConnection.getInputStream();
	} catch (e) {
		var $error = $urlConnection.getErrorStream();
	}
	var result = ($input) ? $input : $error;
	return {
		status: getStatus($urlConnection),
		headers: getHeaders($urlConnection),
		stream: (result) ? $context.api.io.java.adapt(result) : null
	}
}

var Parameters = function(p) {
	if (typeof(p) == "object" && p instanceof Array) {
		return p;
	} else if (typeof(p) == "object") {
		var rv = [];
		for (var x in p) {
			if (typeof(p[x]) == "string") {
				rv.push({ name: x, value: p[x] });
			} else if (typeof(p[x]) == "number") {
				rv.push({ name: x, value: String(p[x]) });
			} else if (typeof(p[x]) == "object" && p[x] instanceof Array) {
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

/**
 * @type { new (configuration: {}) => slime.jrunscript.http.Client }
 */
var Client = function(configuration) {
	var cookies = new Cookies();

	this.request = function(p) {
		var method = (p.method) ? p.method.toUpperCase() : "GET";
		var url = (function() {
			var rv = p.url;
			if (typeof(rv) == "string") rv = $context.api.web.Url.parse(rv);
			if (p.params || p.parameters) {
				$api.deprecate(function() {
					//	First deal with really old "params" version
					if (p.params && !p.parameters) {
						p.parameters = p.params;
						delete p.params;
					}
					//	Then deal with slightly less old "parameters" version
					var string = $context.api.web.Url.query(new Parameters(p.parameters));
					if (string) {
						if (rv.query) {
							rv.query += "&" + string;
						} else {
							rv.query = string;
						}
					}
				})();
			}
			return rv;
		})();
		var headers = (p.headers) ? new Parameters(p.headers) : [];
		var authorization = (function() {
			if (configuration && configuration.authorization) return configuration.authorization;
			if (p.authorization) return p.authorization;
		})();
		if (authorization) {
			headers.push({ name: "Authorization", value: authorization });
		}
		cookies.get(url,headers);

		var myspi = (configuration && configuration.spi) ? configuration.spi(spi) : spi;

		var proxy = (function() {
			if (p.proxy) return p.proxy;
			if (configuration && configuration.proxy) {
				if (typeof(configuration.proxy) == "function") {
					return configuration.proxy(p);
				} else if (typeof(configuration.proxy) == "object") {
					return configuration.proxy;
				}
			}
		})();

		var response = myspi({
			method: method,
			url: url,
			headers: headers,
			body: p.body,
			proxy: proxy,
			timeout: p.timeout
		},cookies);

		response.status.message = response.status.reason;
		$api.deprecate(response.status,"message");

		cookies.set(url.toString(),response.headers);

		response.headers.get = function(name) {
			var values = this
				.filter(function(header) { return header.name.toUpperCase() == name.toUpperCase() })
				.map(function(header) { return header.value; })
			;
			if (values.length == 0) return null;
			if (values.length == 1) return values[0];
			return values;
		}

		var isRedirect = function(status) {
			return (status.code >= 300 && status.code <= 303) || status.code == 307;
		}

		if (isRedirect(response.status)) {
			var redirectTo = response.headers.get("Location");
			if (!redirectTo) throw new Error("Redirect without location header.");
			var redirectUrl = url.resolve(redirectTo);
			//	TODO	copy object rather than modifying
			var rv = {};
			for (var x in p) {
				//	Treating 302 as 303, as many user agents do that; see discussion in RFC 2616 10.3.3
				//	TODO	document this, perhaps after designing mode to be more general
				var TREAT_302_AS_303 = (configuration && configuration.TREAT_302_AS_303);
				var IS_303 = (TREAT_302_AS_303) ? (response.status.code == 302 || response.status.code == 303) : response.status.code == 303;
				if (x == "method" && IS_303) {
					rv.method = "GET";
				} else if (x == "body" && IS_303) {
					//	leave body undefined
				} else {
					rv[x] = p[x];
				}
			}
			rv.url = redirectUrl;
			var callback = new function() {
				this.next = rv;
				this.request = p;
				this.response = response;
			};
			if (p.on && p.on.redirect) {
				p.on.redirect(callback);
			}
			//	rv.body is undefined
			return (callback.next) ? arguments.callee(callback.next) : response;
		} else {
			var parser = (function() {
				if (p.evaluate === JSON) {
					return function(response) {
						if (response.status.code >= 200 && response.status.code <= 299) {
							return JSON.parse(response.body.stream.character().asString());
						} else {
							throw new Error("Status code " + response.status.code);
						}
					}
				}
				if (p.evaluate) return p.evaluate;
				if (p.parse) return $api.deprecate(p.parse);
				return function(response) {
					return response;
				};
			})();
			var type = (function() {
				var string = response.headers.get("Content-Type");
				if (string) {
					return $context.api.io.mime.Type.parse(string);
				}
				return null;
			})();
			return parser({
				request: p,
				status: response.status,
				headers: response.headers,
				body: {
					type: type,
					stream: response.stream
				}
			});
		}
	}

	this.Loader = (function(parent) {
		return function(base) {
			return new $context.api.io.Loader({
				resources: new function() {
					this.toString = function() {
						return "rhino/http/client Loader: base=" + base;
					}

					this.get = function(path) {
						var url = base + path;
						var response = parent.request({
							url: url
						});
						if (response.status.code == 200) {
							var length = response.headers.get("Content-Length");
							var len = (length) ? Number(length) : null;
							return new $context.api.io.Resource({
								length: len,
								read: {
									binary: function() {
										return response.body.stream;
									}
								}
							});
						} else if (response.status.code == 404) {
							return null;
						} else {
							//	TODO	figure out what this API should do in this case
							throw new Error("Status when loading " + url + " is HTTP " + response.status.code);
						}
					}
				}
			});
		}
	})(this);
}

$exports.Client = Client;

$exports.Authentication = new function() {
	this.Basic = new function() {
		this.Authorization = function(p) {
			return new String("Basic " + String(
				Packages.javax.xml.bind.DatatypeConverter.printBase64Binary(
					new Packages.java.lang.String(p.user + ":" + p.password).getBytes()
				)
			));
		}
	}
}

$exports.Body = new function() {
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

	var UrlQuery = function(p) {
		if (typeof(p) == "string") {
			return new QueryString(p);
		} else {
			return new Parameters(p);
		}
	}

	this.Form = function(p) {
		var TYPE = "application/x-www-form-urlencoded";
		if (p.form) {
			return {
				type: TYPE,
				string: p.form.getUrlencoded()
			}
		}
		return {
			type: "application/x-www-form-urlencoded",
			string: QueryString.encode(new UrlQuery(p))
		};
	};

	this.Json = function(p) {
		return {
			type: "application/json",
			string: JSON.stringify(p)
		}
	};
}

$exports.Parser = new function() {
	this.ok = function(f) {
		return function(response) {
			if (response.status.code != 200) {
				var error = new Error("HTTP Status code: " + response.status.code + " message=" + response.status.message);
				error.page = response.body.stream.character().asString();
				throw error;
			}
			return f(response);
		}
	}

	this.OK = $api.deprecate(this.ok);
}

//	TODO	is this used anywhere?
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