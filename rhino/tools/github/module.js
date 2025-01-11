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
	 * @param { slime.jrunscript.tools.github.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.github.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		/**
		 *
		 * @param { string } value
		 * @returns
		 */
		var parseLinkHeader = function(value) {
			return $api.fp.result(
				value,
				$api.fp.string.split(", "),
				$api.fp.Array.map(function(string) {
					var relationFormat = /^\<(.+?)\>\; rel\=\"(.+)\"/;
					var parsed = relationFormat.exec(string);
					return {
						url: parsed[1],
						rel: parsed[2]
					}
				}),
				$api.fp.Array.map(
					/** @returns { [string, string] } */
					function(relation) {
						return [relation.rel, relation.url];
					}
				),
				Object.fromEntries
			);
		}

		var Session = function(o) {
			var apiUrl = function(relative) {
				return "https://api.github.com/" + relative;
			};

			var apiClient = (function(o) {
				/**
				 * @type { slime.jrunscript.http.client.object.Client }
				 */
				var client = new $context.library.http.Client({
					authorization: (o.credentials) ? $context.library.http.Authentication.Basic.Authorization({
						user: o.credentials.user,
						password: o.credentials.password
					}) : void(0)
				});

				var evaluate = function(response) {
					if (response.status.code == 404) return null;
					var string = response.body.stream.character().asString();
					if (response.status.code != 200) {
						$context.library.shell.console("Response code: " + response.status.code + " " + response.request.method + " " + response.request.url);
						$context.library.shell.console(string);
						$context.library.shell.console("");
					}
					var rv = (string) ? JSON.parse(string) : void(0);
					if (response.headers.get("Link")) {
						var link = parseLinkHeader(response.headers.get("Link"));
						rv.next = link.next;
					}
					if (response.status.code == 403 && rv && rv.documentation_url == "https://developer.github.com/v3/#abuse-rate-limits") {
						return {
							retry: true
						}
					}
					if (rv && rv.message == "Bad credentials") throw new Error("Bad credentials.");
					return rv;
				};

				/** @type { (p: slime.jrunscript.http.client.object.Request) => slime.jrunscript.tools.github.Repository[] } */
				var request = (function(was) {
					return function(p) {
						var more = true;
						var retry = 1;
						var rv;
						var next;
						while(more) {
							var json = was.call(this, $api.Object.compose(
								p,
								{ evaluate: evaluate },
								(next) ? { url: next } : {}
							));
							if (rv) {
								rv = rv.concat(json);
							} else {
								rv = json;
							}
							if (rv && rv.retry) {
								//	TODO	X.X should use Retry-After
								//			see https://developer.github.com/v3/guides/best-practices-for-integrators/#dealing-with-abuse-rate-limits
								$context.library.shell.console("Sleeping for " + retry + " seconds...");
								Packages.java.lang.Thread.sleep(retry * 1000);
								retry *= 2;
							} else if (json.next) {
								next = json.next;
								//	more is still true, will cycle
							} else {
								return rv;
							}
						}
					}
				})(client.request);

				return { request: request }
			})(o);

			return new function() {
				this.repositories = new function() {
					this.list = function() {
						return apiClient.request({
							url: apiUrl("user/repos")
						});
					};
				}
			};
		}

		function toWebFormControls(query) {
			/** @type { slime.web.form.Control[] } */
			var rv = [];
			for (var x in query) {
				rv.push({ name: x, value: query[x] });
			}
			return rv;
		}

		function toQueryString(query) {
			var controls = toWebFormControls(query);
			var form = (controls.length > 0) ? { controls: controls } : void(0);
			return (form) ? $context.library.web.Form.codec.urlencoded.encode(form) : void(0);
		}

		/**
		 *
		 * @param { slime.web.Url } url
		 * @param { string } string
		 * @returns { slime.web.Url }
		 */
		function withQueryString(url,string) {
			return $api.Object.compose(url, {
				query: string
			});
		}

		/**
		 *
		 * @param { Parameters<slime.jrunscript.tools.github.Exports["api"]>[0] } api
		 * @param { Parameters<ReturnType<slime.jrunscript.tools.github.Exports["api"]>["authentication"]>[0] } authentication
		 * @param { slime.jrunscript.tools.github.rest.Request } request
		 * @returns { slime.jrunscript.http.client.spi.Argument }
		 */
		function toHttpArgument(api,authentication,request) {
			return {
				request: {
					method: request.method,
					url: withQueryString($context.library.web.Url.resolve(api.server, request.path), toQueryString(request.query)),
					headers: $api.Array.build(function(rv) {
						if (authentication) rv.push({
							name: "Authorization",
							value: $context.library.http.Authentication.Basic.Authorization({
								user: authentication.username,
								password: authentication.token
							})
						});
					}),
					body: (request.body) ? {
						type: $context.library.io.mime.Type.parse("application/json"),
						stream: (function(body) {
							var buffer = new $context.library.io.Buffer();
							buffer.writeText().write(JSON.stringify(body));
							buffer.writeText().close();
							return buffer.readBinary();
						})(request.body)
					} : void(0)
				},
				timeout: {
					connect: 1000,
					read: 1000
				},
				proxy: void(0)
			}
		}

		/**
		 *
		 * @param { Parameters<slime.jrunscript.tools.github.Exports["api"]>[0] } api
		 * @param { Parameters<ReturnType<slime.jrunscript.tools.github.Exports["api"]>["authentication"]>[0] } authentication
		 * @param { slime.web.Url } url
		 * @returns { slime.jrunscript.http.client.spi.Argument }
		 */
		function toPaginatedGetRequest(api,authentication,url) {
			return {
				request: {
					method: "GET",
					url: url,
					headers: $api.Array.build(function(rv) {
						if (authentication) rv.push({
							name: "Authorization",
							value: $context.library.http.Authentication.Basic.Authorization({
								user: authentication.username,
								password: authentication.token
							})
						});
					})
				},
				timeout: {
					connect: 1000,
					read: 1000
				},
				proxy: void(0)
			}
		}

		/**
		 *
		 * @param { slime.jrunscript.http.client.spi.Response } response
		 * @returns { slime.jrunscript.tools.github.rest.Pagination }
		 */
		function links(response) {
			var header = response.headers.find(function(header) {
				return header.name.toLowerCase() == "link";
			});
			return (header) ? parseLinkHeader(header.value) : null;
		}

		function parsePathParameters(o,p) {
			var path = o.path;
			var query = $api.Object.compose(p);
			while(path.indexOf("{") != -1) {
				var start = path.indexOf("{");
				var end = path.indexOf("}");
				var name = path.substring(start+1,end);
				var value = String(p[name]);
				path = path.substring(0,start) + value + path.substring(end+1);
				delete query[name];
			}
			return {
				method: o.method,
				path: path,
				query: query,
				body: void(0)
			}
		}

		/** @type { slime.jrunscript.tools.github.Exports["request"] } */
		var request = {
			test: {
				parsePathParameters: parsePathParameters
			},
			get: function(path) {
				return function(q) {
					return parsePathParameters({
						method: "GET",
						path: path
					}, q);
				}
			},
			delete: function(path) {
				return function(q) {
					return parsePathParameters({
						method: "DELETE",
						path: path
					}, q);
				}
			},
			post: function(path) {
				return function(b) {
					return {
						method: "POST",
						path: path,
						query: void(0),
						body: b
					}
				}
			}
		};

		/** @type { slime.jrunscript.tools.github.Exports["response"] } */
		var response = {
			/** @returns { never } */
			empty: function(p) {
				if (p.status.code == 204) return /** @type { never } */(void(0));
				var body = p.stream.character().asString();
				throw new Error("Expected 204, got " + p.status.code + "\nbody:\n" + body);
			},
			json: {
				resource: function(status) {
					return function(p) {
						if (p.status.code == 404) return null;
						if (p.status.code == status) {
							var string = p.stream.character().asString();
							try {
								return JSON.parse(string);
							} catch (e) {
								throw new Error(e.message + "\response:\n" + string);
							}
						} else {
							throw new Error("Status not " + status + " but " + p.status.code);
						}
					}
				},
				page: function(p) {
					return JSON.parse(p.stream.character().asString());
				}
			}
		};

		$export({
			Session: Session,
			isProjectUrl: function(p) {
				return function(url) {
					return url.host == "github.com" && (
						(url.path == "/" + p.owner + "/" + p.name)
						|| (url.path == "/" + p.owner + "/" + p.name + ".git")
					);
				}
			},
			parseLinkHeader: parseLinkHeader,
			request: request,
			response: response,
			operation: {
				reposGet: {
					request: request.get("/repos/{owner}/{repo}"),
					response: response.json.resource(200)
				},
				reposCreateForAuthenticatedUser: {
					request: request.post("/user/repos"),
					response: response.json.resource(201)
				},
				reposDelete: {
					request: request.delete("/repos/{owner}/{repo}"),
					response: response.empty
				}
			},
			api: function(api) {
				return {
					authentication: function(authentication) {
						return {
							operation: function(operation) {
								return {
									argument: function(argument) {
										return {
											run: function(run) {
												var implementation = (run && run.world) ? run.world.request : $context.library.http.world.java.urlconnection;
												return $api.fp.world.old.ask(function(events) {
													var response = $api.fp.world.input(implementation(
														toHttpArgument(
															api,
															authentication,
															operation.request(argument)
														)
													))();
													return operation.response(response);
												})
											}
										}
									}
								}
							},
							paginated: function(operation) {
								return {
									argument: function(argument) {
										return {
											run: function(run) {
												var implementation = (run && run.world) ? run.world.request : $context.library.http.world.java.urlconnection;
												return $api.fp.world.old.ask(function(events) {
													var request = toHttpArgument(
														api,
														authentication,
														operation.request(argument)
													);
													var rv = [];
													while(request) {
														var response = $api.fp.world.input(implementation(request))();
														var page = operation.response(response);
														rv = rv.concat(page);
														var link = links(response);
														if (link.next) {
															request = toPaginatedGetRequest(
																api,
																authentication,
																$context.library.web.Url.parse(link.next)
															)
														} else {
															request = null;
														}
													}
													return rv;
												})
											}
										}
									}
								}
							}
						}
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages,$api,$context,$export)
