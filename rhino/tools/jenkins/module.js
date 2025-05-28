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
		var readStringStream = $api.fp.world.mapping($context.library.io.InputStream.old.string);

		var readJsonStream = $api.fp.pipe(
			readStringStream,
			JSON.parse
		);

		var readXmlStream = $api.fp.pipe(
			readStringStream,
			$context.library.document.Document.codec.string.decode
		);

		/** @type { slime.$api.fp.Mapping<slime.jrunscript.http.client.Response,slime.$api.fp.Maybe<string>> } */
		var getResponseVersion = $api.fp.pipe(
			$api.fp.property("headers"),
			$api.fp.Stream.from.array,
			$api.fp.Stream.find(function(header) {
				return header.name.toLowerCase() == "x-jenkins";
			}),
			$api.fp.Maybe.map($api.fp.property("value"))
		);

		/** @type { slime.$api.fp.Mapping<slime.jrunscript.http.client.Response,slime.jrunscript.runtime.io.InputStream> } */
		var getResponseStream = $api.fp.pipe(
			function(response) {
				if (response.status.code != 200) throw new Error("Response status: " + response.status.code);
				return response.stream;
			}
		);

		var getResponseJson = $api.fp.pipe(
			getResponseStream,
			readJsonStream
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
		function toHttpRequest(p) {
			return $context.library.http.Argument.from.request({
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
			toHttpRequest,
			$api.fp.world.mapping($context.library.http.world.java.urlconnection)
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
			return getResponseVersion(rv);
		}

		/**
		 *
		 * @param { slime.jrunscript.tools.jenkins.job.Id } id
		 */
		function getJobUrl(id) {
			return id.server + "job" + "/" + id.name + "/";
		}

		$export({
			client: function(c) {
				/** @type { slime.$api.fp.Mapping<string,slime.jrunscript.tools.jenkins.api.Request> } */
				var resourceUrlToJenkinsRequest = function(url) {
					return {
						method: "GET",
						url: url + "api/json",
						credentials: c.credentials
					}
				};

				var resourceUrlToHttpRequest = $api.fp.pipe(
					resourceUrlToJenkinsRequest,
					toHttpRequest
				);

				/** @type { slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.api.Resource> } */
				var fetch = function(resource) {
					return function() {
						return $api.fp.now.invoke(
							resource,
							$api.fp.property("url"),
							resourceUrlToHttpRequest,
							$api.fp.world.mapping($context.library.http.world.java.urlconnection),
							getResponseJson
						)
					}
				};

				/** @type { slime.js.Cast<slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.Server>> } */
				var castToFetchServer = $api.fp.cast.unsafe;

				/** @type { slime.js.Cast<slime.jrunscript.tools.jenkins.Fetch<slime.jrunscript.tools.jenkins.Job>> } */
				var castToFetchJob = $api.fp.cast.unsafe;

				var get_server = function(url) {
					return function(events) {
						return $api.fp.now.invoke(
							url,
							resourceUrlToHttpRequest,
							$api.fp.world.mapping($context.library.http.world.java.urlconnection),
							function(response) {
								return $api.fp.now.invoke(
									getResponseVersion(response),
									$api.fp.Maybe.map(function(version) {
										return $api.Object.compose(
											{
												version: version
											},
											getResponseJson(response)
										)
									})
								);
							}
						)
					}
				};

				return {
					request: function(r) {
						return {
							json: function() {
								var response = request({
									method: r.method,
									url: r.url + "api/json",
									credentials: c.credentials
								});
								return getResponseJson(response);
							}
						}
					},
					get: {
						server: get_server,
						job: function(id) {
							return function(events) {
								return $api.fp.now.invoke(
									id,
									getJobUrl,
									resourceUrlToHttpRequest,
									$api.fp.world.mapping($context.library.http.world.java.urlconnection),
									function(response) {
										if (response.status.code == 404) return $api.fp.Maybe.from.nothing();
										return $api.fp.Maybe.from.some(getResponseJson(response));
									}
								)
							}
						}
					},
					fetch: {
						server: function(server) {
							return function() {
								var maybe = get_server(server)();
								if (!maybe.present) throw new Error("Could not retrieve Jenkins server at: " + server);
								return maybe.value;
							}
						},
						job: castToFetchJob(fetch)
					},
					Job: {
						config: function(p) {
							return function() {
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
				}
			},
			Job: {
				isName: function(name) {
					return $api.fp.pipe($api.fp.property("name"), $api.fp.is(name));
				},
				Id: {
					url: getJobUrl
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
