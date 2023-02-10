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
		var readStringStream = $api.fp.world.mapping($context.library.io.InputStream.string);

		var readJsonStream = $api.fp.pipe(
			readStringStream,
			JSON.parse
		);

		var readXmlStream = $api.fp.pipe(
			readStringStream,
			$context.library.document.Document.codec.string.decode
		);

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.Server } server
		 * @param { string } path A path on that server, without a leading `/`.
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
					if (p.credentials) rv.push({
						name: "Authorization",
						value: $context.library.http.Authentication.Basic.Authorization({
							user: p.credentials.user,
							password: p.credentials.token
						})
					});
				})
			});
		}

		var request = $api.fp.pipe(
			toRequest,
			$api.fp.world.mapping($context.library.http.world.request)
		)

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.Server } server
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
			request: {
				json: function(p) {
					var response = request(p);
					if (response.status.code != 200) throw new TypeError("Response: " + response.status.code);
					return readJsonStream(response.stream);
				}
			},
			getVersion: getVersion,
			client: function(c) {
				/** @type { slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.api.Resource> } */
				var fetch = function(p) {
					return function() {
						var r = toRequest({
							method: "GET",
							url: p.url + "api/json",
							credentials: c.credentials
						});
						var response = $api.fp.world.now.question(
							$context.library.http.world.request,
							r
						);
						if (response.status.code != 200) throw new TypeError("Response code: " + response.status.code + " for " + r.request.method + " " + r.request.url);
						return readJsonStream(response.stream);
					}
				};

				/** @type { slime.js.Cast<slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.Server>> } */
				var castToFetchServer = $api.fp.cast;

				/** @type { slime.js.Cast<slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.Job>> } */
				var castToFetchJob = $api.fp.cast;

				return {
					request: function(r) {
						return {
							json: function() {
								var response = request({
									method: r.method,
									url: r.url + "api/json",
									credentials: c.credentials
								});
								if (response.status.code != 200) throw new TypeError("Response code: " + response.status.code + " for " + r.method + " " + r.url + "api/json");
								return readJsonStream(response.stream);
							}
						}
					},
					server: function(p) {
						return function() {
							var r = toRequest({
								method: "GET",
								url: p.server.url + "api/json",
								credentials: c.credentials
							});
							var response = $api.fp.world.now.question(
								$context.library.http.world.request,
								r
							);
							if (response.status.code != 200) throw new TypeError("Response code: " + response.status.code + " for " + r.request.method + " " + r.request.url);
							return readJsonStream(response.stream);
						}
					},
					fetch: {
						server: castToFetchServer(fetch),
						job: castToFetchJob(fetch)
					},
					Job: {
						config: function(p) {
							var response = request({
								method: "GET",
								url: p.url + "config.xml",
								credentials: c.credentials
							});
							var parsed = readXmlStream(response.stream);
							return parsed;
						}
					}
				}
			},
			Server: {
				url: function(server) {
					return function(path) {
						return server.url + path;
					}
				}
			},
			Job: {
				from: {
					id: function(id) {
						return {
							url: id.server.url + "job" + "/" + id.name + "/"
						}
					}
				},
				isName: function(name) {
					return $api.fp.pipe($api.fp.property("name"), $api.fp.is(name));
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
