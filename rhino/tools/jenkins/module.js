//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.jenkins.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.jenkins.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.api.Server } server
		 * @param { string } path
		 * @returns
		 */
		function url(server, path) {
			return server.url + path;
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.api.Request } p
		 * @returns { slime.jrunscript.http.client.spi.Argument }
		 */
		function toRequest(p) {
			return $context.library.http.world.Argument.request({
				method: p.method,
				url: p.url,
				headers: $api.Array.build(function(rv) {
					var credentials = (p.credentials) ? p.credentials(p.url) : void(0);
					if (credentials) rv.push({
						name: "Authorization",
						value: $context.library.http.Authentication.Basic.Authorization({
							user: credentials.user,
							password: credentials.token
						})
					});
				})
			});
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.api.Request } p
		 * @returns { slime.jrunscript.http.client.spi.Response }
		 */
		function request(p) {
			return $api.Function.world.now.question($context.library.http.world.request, toRequest(p));
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.api.Server } server
		 */
		function getVersion(server) {
			var rv = request({
				method: "GET",
				url: url(server, "api/json"),
				credentials: void(0),
			});
			/** @type { string } */
			var version;
			rv.headers.forEach(function(header) {
				if (header.name.toLowerCase() == "x-jenkins") {
					version = header.value;
				}
			});
			return version;
		}

		$export({
			Credentials: {
				list: function(p) {
					return function(url) {
						for (var i=0; i<p.length; i++) {
							var server = p[i].server;
							if (url.substring(0,server.length) == server) {
								return p[i].use;
							}
						}
						return null;
					}
				}
			},
			request: {
				json: function(p) {
					var response = request(p);
					if (response.status.code != 200) throw new TypeError("Response: " + response.status.code);
					return JSON.parse(response.stream.character().asString());
				}
			},
			url: function(p) {
				// var toPath = function(given) {
				// 	if (given.substring(0,1) == "/") given = given.substring(1);
				// 	return given + "api/json";
				// }
				return url(p.server, p.path);
			},
			getVersion: function(s) {
				return getVersion(s);
			},
			client: function(c) {
				return {
					request: function(r) {
						return {
							json: function() {
								var response = request({
									method: r.method,
									url: r.url + "api/json",
									credentials: c
								});
								if (response.status.code != 200) throw new TypeError("Response code: " + response.status.code + " for " + r.method + " " + r.url + "api/json");
								return JSON.parse(response.stream.character().asString());
							}
						}
					},
					fetch: function(o) {
						var response = request({
							method: "GET",
							url: o.url + "api/json",
							credentials: c
						});
						if (response.status.code != 200) throw new TypeError("Response code: " + response.status.code + " for " + "GET" + " " + o.url + "api/json");
						return JSON.parse(response.stream.character().asString());
					},
					Job: {
						config: function(p) {
							var response = request({
								method: "GET",
								url: p.url + "config.xml",
								credentials: c
							});
							var xml = response.stream.character().asString();
							var parsed = $context.library.document.Document.codec.string.decode(xml);
							return parsed;
						}
					}
				}
			},
			Server: function(o) {
				var client = new $context.library.http.Client();

				this.request = function(p) {
					return client.request({
						url: o.url + p.url,
						parameters: p.parameters,
						evaluate: function(response) {
							return eval("(" + response.body.stream.character().asString() + ")");
						}
					});
				};

				var request = function(client,p) {
					var parameters = $api.Object.compose({}, (p.parameters) ? p.parameters : {});
					if (p.depth) parameters.depth = p.depth;
					if (p.tree) parameters.tree = p.tree;
					var evaluate = (p.evaluate) ? p.evaluate : function(response) {
						var string = response.body.stream.character().asString();
						return eval("(" + string + ")");
					};
					return client.request({
						url: (p.fullurl) ? p.fullurl : o.url + p.url,
						parameters: parameters,
						evaluate: evaluate
					});
				}

				var BuildRef = function(client,job,json) {
					this.toString = function() {
						return "BuildRef: job=" + job.url + " json=" + JSON.stringify(json);
					};

					this.job = job;
					this.number = json.number;
					this.url = json.url;

					this.load = function() {
						return request(client,{ fullurl: json.url + "api/json", depth: "3" });
					}
				}

				var JobRef = function(client,json) {
					this.url = json.url;
					this.name = json.name;

					this.request = function(p) {
						return request(client,p);
					}

					this.json = json;

					var load = function() {
						return request(client,{ fullurl: json.url + "api/json", depth: "2" });
					}

					this.builds = function() {
						return request(client,{ fullurl: json.url + "api/json", tree: "builds[number,timestamp,id,result]" }).builds;
						// var loaded = load();
						// var job = this;
						// return loaded.builds.map(function(json) {
						// 	return new BuildRef(client,job,json);
						// });
					}

					this.load = function() {
						return load();
					};

					this.configuration = new function() {
						this.get = function() {
							return request(
								client,
								{
									fullurl: json.url + "config.xml",
									evaluate: function(response) {
										return new $context.library.document.Document({
											string: response.body.stream.character().asString()
										});
									}
								}
							)
						};
					}
				}

				this.Session = function(s) {
					var c = {};

					if (s && s.credentials) {
						c.authorization = $context.library.http.Authentication.Basic.Authorization(s.credentials);
					}

					var client = new $context.library.http.Client(c);

					this.request = function(p) {
						return request(client,p);
					};

					this.api = function() {
						var rv = request(client,{
							url: "api/json"
						});
						rv.jobs = rv.jobs.map(function(json) {
							return new JobRef(client,json);
						});
						return rv;
					}
				}
			},
			api: {
				JobSummary: {
					isName: function(name) {
						return $api.Function.pipe($api.Function.property("name"), $api.Function.is(name));
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
