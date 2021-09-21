//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.http.client.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.jrunscript.http.client.Exports } $exports
	 */
	function(Packages,$api,$context,$loader,$exports) {
		Packages.java.lang.System.setProperty("sun.net.http.allowRestrictedHeaders", "true");

		(
			function verifyContext($context) {
				$context.property("api").require();
				$context.property("api","js").require();
				$context.property("api","js").require();
				$context.property("api","java").require();
				$context.property("api","web").require();
			}
		)($api.Value($context,"$context"));

		var code = {
			/** @type { slime.jrunscript.http.client.internal.cookies.Load } */
			cookies: $loader.factory("cookies.js"),
			/** @type { slime.jrunscript.http.client.internal.objects.load } */
			objects: $loader.factory("objects.js")
		};

		var scripts = {
			cookies: code.cookies()
		};

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

		/**
		 *
		 * @param { slime.jrunscript.http.client.request.Body } body
		 */
		function getRequestBodyType(body) {
			if (typeof(body.type) == "string") {
				return $api.mime.Type.codec.declaration.decode(body.type);
			} else if (!body.type) {
				//	TODO	Would be more accurate to return null and remove the content type, but this does not seem to work; Java
				//			seems to default to application/x-www-form-urlencoded
				return $api.mime.Type.codec.declaration.decode("application/octet-stream");
			} else {
				return body.type;
			}
		}

		var useJavaCookieManager = (function() {
			//	Currently we handle the bridge to Java properties here so as not to introduce a dependency on rhino/shell, but
			//	there may be a better way to deal with this;
			//	TODO	perhaps system properties should be moved into rhino/host
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
				return scripts.cookies.inonit();
			} else {
				return scripts.cookies.java();
			}
		};

		/** @type { slime.jrunscript.http.client.spi.Implementation } */
		function urlConnectionImplementation(p) {
			/**
			 *
			 * @param { slime.jrunscript.native.java.net.URLConnection } $urlConnection
			 */
			var getResponseStatus = function($urlConnection) {
				if ($urlConnection.getResponseCode() == -1) {
					//	used to check for response message here, but at least one extant HTTP server (Stash) omits the OK
					throw new Error("Response was not valid HTTP: " + $urlConnection);
				}
				return {
					code: Number($urlConnection.getResponseCode()),
					reason: String($urlConnection.getResponseMessage())
				};
			};

			/**
			 *
			 * @param { slime.jrunscript.native.java.net.URLConnection } $urlConnection
			 * @returns { slime.jrunscript.http.client.Header[] }
			 */
			var getResponseHeaders = function($urlConnection) {
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
			};

			/**
			 *
			 * @param { slime.jrunscript.native.java.net.URLConnection } $urlConnection
			 * @returns { slime.jrunscript.runtime.io.InputStream }
			 */
			var getResponseBodyStream = function($urlConnection) {
				var result = (function() {
					try {
						return $urlConnection.getInputStream();
					} catch (e) {
						return $urlConnection.getErrorStream();
					}
				})();
				return (result) ? $context.api.io.java.adapt(result) : null;
			}

			// var mode = {
			// 	proxy: p.proxy,
			// 	timeout: p.timeout
			// }

			var hostHeader;
			if (p.request.url.scheme == "https" && p.proxy && p.proxy.https) {
				//	Currently implemented by re-writing the URL; would be better to implement a tunnel through an HTTP proxy but
				//	could not get that working with Tomcat, which returned 400 errors when https requests are sent to http listener
				//	TODO	does this work for default port?
				hostHeader = p.request.url.host + ((p.request.url.port) ? ":" + p.request.url.port : "");
				p.request.url.host = p.proxy.https.host;
				p.request.url.port = p.proxy.https.port;
			}

			var $url = new Packages.java.net.URL(p.request.url.toString());
			debug("Requesting: " + p.request.url);

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
			})(p.proxy);

			$urlConnection.setRequestMethod(p.request.method);

			if (p.timeout) {
				if (p.timeout.connect) {
					$urlConnection.setConnectTimeout(p.timeout.connect);
				}
				if (p.timeout.read) {
					$urlConnection.setReadTimeout(p.timeout.read);
				}
			}

			if (hostHeader) {
				$urlConnection.addRequestProperty("Host",hostHeader);
			}
			p.request.headers.forEach( function(header) {
				$urlConnection.addRequestProperty(header.name,header.value);
			});

			$urlConnection.setInstanceFollowRedirects(false);

			if (p.request.body) {
				$urlConnection.setDoOutput(true);

				$urlConnection.setRequestProperty(
					"Content-Type",
					$api.mime.Type.codec.declaration.encode(getRequestBodyType(p.request.body))
				);

				$context.api.io.Streams.binary.copy(
					p.request.body.stream,
					$context.api.io.java.adapt($urlConnection.getOutputStream()),
					{
						onFinish: function(from,to) {
							to.close();
						}
					}
				);
			}

			/** @type { slime.jrunscript.http.client.spi.Response } */
			var rv = {
				status: getResponseStatus($urlConnection),
				headers: getResponseHeaders($urlConnection),
				stream: getResponseBodyStream($urlConnection)
			}

			return rv;
		}

		/** @type { slime.jrunscript.http.client.internal.Parameters } */
		var Parameters = function(p) {
			if (typeof(p) == "object" && p instanceof Array) {
				return p;
			} else if (typeof(p) == "object") {
				var rv = [];

				/** @type { (v: any) => v is Array } */
				var isArray = function(v) {
					return v instanceof Array;
				}

				/** @type { (v: any) => v is string } */
				var isString = function(v) {
					return typeof(v) == "string";
				}

				/** @type { (v: any) => v is number } */
				var isNumber = function(v) {
					return typeof(v) == "number";
				}

				for (var x in p) {
					var value = p[x];
					if (isString(value)) {
						rv.push({ name: x, value: value });
					} else if (isNumber(value)) {
						rv.push({ name: x, value: String(value) });
					} else if (typeof(value) == "object" && isArray(value)) {
						value.forEach( function(item) {
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

		/** @type { slime.jrunscript.http.client.internal.sessionRequest } */
		var sessionRequest = function(cookies) {
			return function(argument) {
				//	TODO	this implementation mutates the request but provides an immutable-appearing signature for
				//			forward-compatibility
				cookies.get(argument.request.url, argument.request.headers);
				return argument;
			}
		};

		/** @type { slime.jrunscript.http.client.internal.authorizedRequest } */
		var authorizedRequest = function(authorization) {
			return function(argument) {
				//	TODO	this implementation mutates the request but provides an immutable-appearing signature for
				//			forward-compatibility
				if (authorization) {
					argument.request.headers.push({ name: "Authorization", value: authorization });
				}
				return argument;
			}
		};

		/** @type { slime.jrunscript.http.client.internal.proxiedRequest } */
		var proxiedRequest = function(proxy) {
			return function(argument) {
				//	TODO	this implementation mutates the request but provides an immutable-appearing signature for
				//			forward-compatibility
				argument.proxy = proxy;
				return argument;
			}
		};

		scripts.objects = code.objects({
			Cookies: Cookies,
			api: {
				io: $context.api.io,
				web: $context.api.web
			},
			Parameters: Parameters,
			urlConnectionImplementation: urlConnectionImplementation,
			sessionRequest: sessionRequest,
			authorizedRequest: authorizedRequest,
			proxiedRequest: proxiedRequest
		});

		$exports.Client = scripts.objects;

		$exports.Authentication = {
			Basic: {
				/**
				 * @param { { user: string, password: string }} p
				 */
				Authorization: function(p) {
					return "Basic " + String(
						Packages.javax.xml.bind.DatatypeConverter.printBase64Binary(
							new Packages.java.lang.String(p.user + ":" + p.password).getBytes()
						)
					);
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
					return QueryString(p);
				} else {
					return Parameters(p);
				}
			}

			this.Form = function(p) {
				var TYPE = $context.api.web.Form.type;
				if (p.form) {
					return {
						type: TYPE,
						string: p.form.getUrlencoded()
					}
				}
				return {
					type: TYPE,
					string: QueryString.encode(UrlQuery(p))
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
						var error = Object.assign(
							new Error("HTTP Status code: " + response.status.code + " message=" + response.status.message),
							{ page: response.body.stream.character().asString() }
						);
						throw error;
					}
					return f(response);
				}
			}

			this.OK = $api.deprecate(this.ok);
		}

		//	TODO	is this used anywhere?
		/** @constructor */
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
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$exports)
