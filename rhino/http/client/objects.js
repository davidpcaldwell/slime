//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.http.client.internal.objects.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.http.client.internal.objects.Export> } $export
	 */
	function(Packages,$api,$context,$export) {
		var Cookies = $context.Cookies;
		var urlConnectionImplementation = $context.urlConnectionImplementation;
		var sessionRequest = $context.sessionRequest;
		var authorizedRequest = $context.authorizedRequest;
		var proxiedRequest = $context.proxiedRequest;

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

		var Client = (function() {
			/**
			 * @this { slime.jrunscript.http.client.Response["headers"] }
			 * @param { string } name
			 */
			function headersImplementationForGet(name) {
				var values = this
					.filter(function(header) { return header.name.toUpperCase() == name.toUpperCase() })
					.map(function(header) { return header.value; })
				;
				if (values.length == 0) return null;
				if (values.length == 1) return values[0];
				return values;
			}

			/**
			 *
			 * @param { slime.jrunscript.http.client.Response["headers"] } headers
			 * @returns { slime.jrunscript.http.client.object.Response["headers"] }
			 */
			function withHeadersGet(headers) {
				/** @type { slime.jrunscript.http.client.object.Response["headers"] } */
				var rv = Object.assign(headers, { get: void(0) });
				rv["get"] = headersImplementationForGet;
				return rv;
			}

			/**
			 *
			 * @param { slime.jrunscript.http.client.Response } spiresponse
			 * @param { slime.jrunscript.http.client.object.Request } request
			 * @returns { slime.jrunscript.http.client.object.Response }
			 */
			var toResponse = function(spiresponse,request) {
				var type = (function() {
					var string = headersImplementationForGet.call(spiresponse.headers, "Content-Type");
					if (string) {
						return $context.api.io.mime.Type.parse(string);
					}
					return null;
				})();

				var rv = {
					request: request,
					status: $api.Object.compose(spiresponse.status, { message: spiresponse.status.reason }),
					headers: withHeadersGet(spiresponse.headers),
					body: {
						type: type,
						stream: spiresponse.stream
					}
				}

				$api.deprecate(rv.status, "message");

				return rv;
			};

			/**
			 *
			 * @param { slime.jrunscript.http.client.object.Request } p
			 * @returns { slime.jrunscript.http.client.spi.Argument }
			 */
			var interpretRequest = function(p) {
				var method = (p.method) ? p.method.toUpperCase() : "GET";

				var url = (function() {
					var rv = (typeof(p.url) == "string") ? $context.api.web.Url.parse(p.url) : p.url;
					if (p.params || p.parameters) {
						$api.deprecate(function() {
							//	First deal with really old "params" version
							if (p.params && !p.parameters) {
								p.parameters = p.params;
								delete p.params;
							}
							//	Then deal with slightly less old "parameters" version
							var string = $context.api.web.Url.query(Parameters(p.parameters));
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

				var headers = (p.headers) ? Parameters(p.headers) : [];

				var body = $context.interpretRequestBody(p.body);

				return {
					request: {
						method: method,
						url: url,
						headers: headers,
						body: body
					},
					proxy: p.proxy,
					timeout: p.timeout
				};
			}

			/**
			 *
			 * @param { slime.jrunscript.http.client.spi.Argument } argument
			 * @returns { slime.jrunscript.http.client.spi.old.Request }
			 */
			function toOldRequest(argument) {
				var stream = argument.request.body.stream;
				var buffer = new Packages.java.io.ByteArrayOutputStream();
				$context.api.io.Streams.binary.copy(stream, buffer, {
					onFinish: function(i,o) {
						i.close();
						o.close();
					}
				});

				return {
					method: argument.request.method,
					url: argument.request.url,
					headers: argument.request.headers,
					body: {
						type: argument.request.body.type,
						read: {
							binary: function() {
								var bytes = buffer.toByteArray();
								var _i = new Packages.java.io.ByteArrayInputStream(bytes);
								return $context.api.io.InputStream.from.java(_i);
							}
						}
					},
					proxy: argument.proxy,
					timeout: argument.timeout
				}
			}

			/**
			 * @type { slime.jrunscript.http.client.spi.old.implementation }
			 */
			function oldspi(p) {
				var body = $context.interpretRequestBody(p.body);
				return $api.fp.world.input(urlConnectionImplementation({
					request: {
						method: p.method,
						url: p.url,
						headers: p.headers,
						body: body
					},
					proxy: p.proxy,
					timeout: p.timeout
				}))();
			}

			/**
			 * @param { slime.jrunscript.http.client.object.Configuration } configuration
			 * @param { slime.jrunscript.http.client.internal.Cookies } cookies
			 * @param { slime.jrunscript.http.client.object.Request & { evaluate?: any, parse?: any } } p
			 */
			function request(configuration, cookies, p) {
				var authorization = (function() {
					if (p.authorization) return p.authorization;
					if (configuration && configuration.authorization) return configuration.authorization;
				})();

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

				var spirequest = $api.fp.result(
					interpretRequest(p),
					sessionRequest(cookies),
					authorizedRequest(authorization),
					proxiedRequest(proxy)
				);

				var spiImplementation = (configuration && configuration.spi) ? configuration.spi(oldspi) : oldspi;

				var spiresponse = spiImplementation(toOldRequest(spirequest));
				cookies.set($context.api.web.Url.codec.string.encode(spirequest.request.url),spiresponse.headers);

				var isRedirect = function(status) {
					return (status.code >= 300 && status.code <= 303) || status.code == 307;
				}

				if (isRedirect(spiresponse.status)) {
					var redirectTo = headersImplementationForGet.call(spiresponse.headers, "Location");
					if (redirectTo === null) throw new Error("Redirect without location header.");
					var redirectUrl = $context.api.web.Url.resolve(spirequest.request.url, redirectTo);
					//	TODO	copy object rather than modifying
					var rv = {};
					for (var x in p) {
						//	Treating 302 as 303, as many user agents do that; see discussion in RFC 2616 10.3.3
						//	TODO	document this, perhaps after designing mode to be more general
						var TREAT_302_AS_303 = (configuration && configuration.TREAT_302_AS_303);
						var IS_303 = (TREAT_302_AS_303) ? (spiresponse.status.code == 302 || spiresponse.status.code == 303) : spiresponse.status.code == 303;
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
						this.response = spiresponse;
					};
					if (p.on && p.on.redirect) {
						p.on.redirect(callback);
					}
					//	rv.body is undefined
					return (callback.next) ? arguments.callee(configuration, cookies, callback.next) : toResponse(spiresponse, p);
				} else {
					var response = toResponse(spiresponse, p);

					var postprocessor = (function() {
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

					return postprocessor(response);
				}
			}

			/**
			 *
			 * @param { slime.jrunscript.http.client.object.Configuration } configuration
			 */
			var Client = function(configuration) {
				var cookies = Cookies();

				/**
				 * @param { slime.jrunscript.http.client.object.Request & { evaluate?: any, parse?: any } } p
				 */
				this.request = function(p) {
					return request(configuration, cookies, p);
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

			return Client;
		})();

		var Body = new function() {
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

			//	TODO	not declared in TypeScript so possibly unused
			this.Json = function(p) {
				return {
					type: "application/json",
					string: JSON.stringify(p)
				}
			};
		}

		var Authentication = {
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

		var Parser = new function() {
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

		$export({
			Client: Client,
			Body: Body,
			Authentication: Authentication,
			Parser: Parser
		})
	}
//@ts-ignore
)(Packages,$api,$context,$export);
