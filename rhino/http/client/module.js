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
	 * @param { slime.loader.Export<slime.jrunscript.http.client.Exports> } $export
	 */
	function(Packages,$api,$context,$loader,$export) {
		Packages.java.lang.System.setProperty("sun.net.http.allowRestrictedHeaders", "true");

		(
			function verifyContext($context) {
				$context.property("api").require();
				$context.property("api","web").require();
				$context.property("api","java").require();
				$context.property("api","io").require();
			}
		)($api.Value($context,"$context"));

		var code = {
			/** @type { slime.jrunscript.http.client.internal.cookies.Script } */
			cookies: $loader.script("cookies.js"),
			/** @type { slime.jrunscript.http.client.internal.objects.Script } */
			objects: $loader.script("objects.js")
		};

		var scripts = {
			cookies: code.cookies(),
			//	'objects' is loaded later
			/** @type { slime.jrunscript.http.client.internal.objects.Export } */
			objects: void(0)
		};

		var allowMethods = function() {
			var methodsField = $context.api.java.toNativeClass(Packages.java.net.HttpURLConnection).getDeclaredField("methods");

			var permitted = Array.prototype.slice.call(arguments);

			$api.debug.disableBreakOnExceptionsFor(function() {
				try {
					var modifiersField = $context.api.java.toNativeClass(Packages.java.lang.reflect.Field).getDeclaredField("modifiers");
					modifiersField.setAccessible(true);
					modifiersField.setInt(methodsField, methodsField.getModifiers() & ~Packages.java.lang.reflect.Modifier.FINAL);

					methodsField.setAccessible(true);

					var oldMethods = $context.api.java.Array.adapt(methodsField.get(null));
					var newMethods = oldMethods.concat(permitted);

					var array = newMethods.map(function(s) { return new Packages.java.lang.String(s); });

					methodsField.set(
						null,
						$context.api.java.Array.create({
							type: Packages.java.lang.String,
							array: array
						})
					);
				} catch (e) {
					//	TODO	will be reached in JDK 11 (Nashorn only?) as JPMS prohibits access to Field.modifiers for now
					//	TODO	thus, PATCH will not be allowed under JDK 11. See issue #915.
				}
			})();
		};

		allowMethods("PATCH");

		/**
		 *
		 * @param { slime.jrunscript.http.client.request.Body } body
		 * @returns { slime.mime.Type }
		 */
		function _getRequestBodyType(body) {
			if (typeof(body.type) == "string") {
				return $api.mime.Type.codec.declaration.decode(body.type);
			} else {
				return body.type;
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.http.client.request.Body } body
		 * @returns { slime.jrunscript.runtime.io.InputStream }
		 */
		function _getRequestBodyStream(body) {
			//	TODO	Does not handle stream/$stream from rhino/mime
			//			above is a very old comment; may no longer apply

			/** @type { (body: slime.jrunscript.http.client.request.Body) => body is slime.jrunscript.http.client.request.body.Resource } */
			var isBinary = function(body) {
				return Boolean(body["read"] && body["read"].binary);
			}

			/** @type { (body: slime.jrunscript.http.client.request.Body) => body is slime.jrunscript.http.client.request.body.String } */
			var isString = function(body) {
				return typeof body["string"] != "undefined";
			}

			if (isBinary(body)) return body.read.binary();
			if (isString(body)) {
				var buffer = new $context.api.io.Buffer();
				buffer.writeText().write(body.string);
				buffer.writeText().close();
				return buffer.readBinary();
			}
			throw new TypeError("Body is not a recognized type: " + body);
		}

		/**
		 *
		 * @param { slime.jrunscript.http.client.request.Body } p
		 * @returns { slime.jrunscript.http.client.spi.request.Body }
		 */
		var _interpretRequestBody = function(p) {
			if (typeof(p) == "undefined") return void(0);
			if (p === null) return null;
			return {
				type: _getRequestBodyType(p),
				stream: _getRequestBodyStream(p)
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.http.client.spi.request.Body } body
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

			/**
			 *
			 * @param { slime.web.Url } url
			 * @param { slime.jrunscript.http.client.Proxies } proxy
			 * @param { slime.$api.event.Emitter<slime.jrunscript.http.client.Events> } events
			 * @returns
			 */
			var openUrlConnection = function(url,proxy,events) {
				/**
				 *
				 * @param { slime.jrunscript.native.java.net.URL } _url
				 * @param { slime.jrunscript.native.java.net.Proxy } _proxy
				 * @returns { slime.jrunscript.native.java.net.URLConnection }
				 */
				var _open = function(_url,_proxy) {
					if (_proxy) {
						return _url.openConnection(_proxy);
					} else {
						return _url.openConnection();
					}
				}

				/**
				 *
				 * @param { slime.jrunscript.http.client.Proxies } proxy
				 * @returns { slime.jrunscript.native.java.net.Proxy }
				 */
				var toJavaProxy = function(proxy) {
					if (!proxy) {
						return null;
					} else if (proxy.https) {
						return null;
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
						return _proxy;
					}
				}

				events.fire("request", {
					url: url,
					proxy: proxy
				});

				return _open(new Packages.java.net.URL($context.api.web.Url.codec.string.encode(url)), toJavaProxy(proxy));
			}

			var execute = (
				/**
				 *
				 * @param { slime.$api.event.Emitter<slime.jrunscript.http.client.Events> } e
				 */
				function(e) {
					var url = p.request.url;
					/** @type { slime.jrunscript.http.client.Header } */
					var hostHeader;

					(
						function implementHttpProxying() {
							if (url.scheme == "https" && p.proxy && p.proxy.https) {
								//	Currently implemented by re-writing the URL; would be better to implement a tunnel through an HTTP proxy but
								//	could not get that working with Tomcat, which returned 400 errors when https requests are sent to http listener
								//	TODO	does this work for default port?
								hostHeader = { name: "Host", value: url.host + ((url.port) ? ":" + url.port : "") };
								url.host = p.proxy.https.host;
								url.port = p.proxy.https.port;
							}
						}
					)();

					var $urlConnection = openUrlConnection(url, p.proxy, e);

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
						$urlConnection.addRequestProperty(hostHeader.name, hostHeader.value);
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

					return {
						status: getResponseStatus($urlConnection),
						headers: getResponseHeaders($urlConnection),
						stream: getResponseBodyStream($urlConnection)
					};
				}
			);

			return execute;
		}

		var isHeaderName = function(name) {
			return function(header) {
				return header.name.toLowerCase() == name.toLowerCase();
			}
		}

		var Header = {
			value: function(name) {
				return function(headers) {
					var filtered = headers.filter(isHeaderName(name));
					if (filtered.length > 1) throw new Error("Expected only one match for header " + name + ", but got more than one");
					return $api.fp.result(
						$api.fp.Maybe.from.value(filtered[0]),
						$api.fp.Maybe.map($api.fp.property("value"))
					);
				}
			},
			values: function(name) {
				return function(headers) {
					var filtered = headers.filter(isHeaderName(name));
					return filtered.map($api.fp.property("value"));
				}
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.http.client.spi.Implementation } implementation
		 */
		var withFollowRedirects = function(implementation) {
			/** @param { slime.jrunscript.http.client.Response } response */
			var getLocation = function(response) {
				var value = Header.value("Location")(response.headers);
				if (value.present) {
					return value.value;
				}
				throw new Error("Expected: 'Location' header.");
			};

			/**
			 *
			 * @param { slime.web.Url } requested
			 * @param { string } redirected
			 * @returns
			 */
			var getRedirectUrl = function(requested, redirected) {
				return $context.api.web.Url.resolve(requested, redirected);
			};

			/**
			 * @type { slime.jrunscript.http.client.spi.Implementation }
			 */
			return function fetch(argument) {
				return function(events) {
					var response = implementation(argument)(events);

					var getRedirectDestination = function() {
						return getRedirectUrl(argument.request.url, getLocation(response));
					}

					//	TODO	should make 302 handling more explicit

					if (response.status.code == 301 || response.status.code == 302 || response.status.code == 303) {
						return fetch(
							$api.Object.compose(
								argument,
								{
									request: $api.Object.compose(
										argument.request,
										{
											method: "GET",
											url: getRedirectDestination(),
											body: void(0)
										}
									)
								}
							)
						)(events);
					} else if (response.status.code == 307 || response.status.code == 308) {
						return fetch(
							$api.Object.compose(
								argument,
								{
									request: $api.Object.compose(
										argument.request,
										{
											url: getRedirectDestination()
										}
									)
								}
							)
						)(events);
					}

					return response;
				}
			}
		}

		/** @type { slime.jrunscript.http.client.internal.sessionRequest } */
		var sessionRequest = function(cookies) {
			return function(argument) {
				//	TODO	this implementation mutates the request but provides an immutable-appearing signature for
				//			forward-compatibility
				cookies.get($context.api.web.Url.codec.string.encode(argument.request.url), argument.request.headers);
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
			urlConnectionImplementation: urlConnectionImplementation,
			sessionRequest: sessionRequest,
			authorizedRequest: authorizedRequest,
			proxiedRequest: proxiedRequest,
			interpretRequestBody: _interpretRequestBody
		});

		/** @type { slime.jrunscript.http.client.Exports["Argument"]["from"]["request"] } */
		var Request_to_Argument = function(request) {
			/**
			 *
			 * @param { slime.jrunscript.http.client.request.url } value
			 * @returns { slime.web.Url }
			 */
			function url(value) {
				if (typeof(value) == "string") {
					return $context.api.web.Url.codec.string.decode(value);
				} else {
					return value;
				}
			}

			return {
				request: {
					method: (request.method) ? request.method : "GET",
					url: url(request.url),
					headers: (request.headers) ? request.headers : [],
					body: (request.body) ? _interpretRequestBody(request.body) : null
				},
				timeout: void(0),
				proxy: void(0)
			}
		}

		var Implementation_operations = {
			withFollowRedirects: withFollowRedirects,
			sensor: function(implementation) {
				return $api.fp.world.Question.pipe(Request_to_Argument, implementation);
			}
		}

		$export({
			Header: Header,
			world: {
				java: {
					urlconnection: urlConnectionImplementation
				}
			},
			Implementation: {
				from: {
					java: {
						urlconnection: urlConnectionImplementation
					}
				},
				operations: Implementation_operations,
				methods: function(implementation) {
					return $api.fp.methods.pin(implementation)(Implementation_operations);
				}
			},
			Request: {
				spi: Request_to_Argument
			},
			Argument: {
				from: {
					request: Request_to_Argument
				}
			},
			World: {
				withFollowRedirects: withFollowRedirects,
				question: function(implementation) {
					return $api.fp.world.Question.pipe(Request_to_Argument, implementation);
				}
			},
			Client: scripts.objects.Client,
			Body: {
				Form: scripts.objects.Body.Form,
				json: function() {
					return function(value) {
						return {
							type: $api.mime.Type.parse("application/json"),
							stream: (function(body) {
								var buffer = new $context.api.io.Buffer();
								buffer.writeText().write(JSON.stringify(body));
								buffer.writeText().close();
								return buffer.readBinary();
							})(value)
						};
					}
				}
			},
			Authentication: scripts.objects.Authentication,
			Parser: scripts.objects.Parser
		})
	}
//@ts-ignore
)(Packages,$api,$context,$loader,$export)
