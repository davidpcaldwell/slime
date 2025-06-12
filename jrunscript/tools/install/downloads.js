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
	 * @param { slime.jrunscript.tools.install.downloads.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.install.downloads.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 * @param { slime.jrunscript.http.client.spi.Implementation } client
		 * @param { slime.$api.event.Emitter<slime.jrunscript.tools.install.download.Events> } events
		 */
		var fetcher = function(client,events) {
			return $api.fp.world.Sensor.old.mapping({
				sensor: client,
				handlers: {
					request: function(e) {
						events.fire("request", e.detail);
					}
				}
			});
		}

		var DEFAULT_CLIENT = $context.library.http.World.withFollowRedirects($context.library.http.world.java.urlconnection);

		/**
		 * @param { { client?: slime.jrunscript.http.client.spi.Implementation, cache?: slime.jrunscript.tools.install.downloads.Cache } } c
		 * @returns { slime.$api.fp.world.Sensor<slime.jrunscript.tools.install.Distribution,slime.jrunscript.tools.install.download.Events,slime.jrunscript.tools.install.downloads.Download> }
		 */
		var find = function(c) {
			var client = c.client || DEFAULT_CLIENT;
			var downloads = c.cache;
			return function(distribution) {
				return function(events) {
					/** @param { slime.jrunscript.http.client.Response } response */
					var getResponseMimeType = function(response) {
						return $api.fp.result(
							$context.library.http.Header.value("Content-Type")(response.headers),
							$api.fp.Maybe.map($api.mime.Type.codec.declaration.decode),
							function(maybe) {
								if (maybe.present && maybe.value.media == "application" && maybe.value.subtype == "octet-stream") return $api.fp.Maybe.from.nothing();
								return maybe;
							}
						);
					};

					/** @type { () => slime.jrunscript.tools.install.downloads.Download } */
					var get = function() {
						var fetch = fetcher(client, events);

						var getResponse = function() {
							return fetch(
								$context.library.http.Argument.from.request({
									url: distribution.url
								})
							);
						};

						var response = getResponse();

						var type = getResponseMimeType(response);
						var stream = response.stream;
						return {
							type: type,
							read: function() {
								if (stream) {
									var rv = stream;
									stream = null;
									return rv;
								}
								return getResponse().stream
							}
						};
					};

					if (distribution.name && downloads) {
						var store = downloads(distribution.name);
						get = $api.fp.impure.Input.cache(store)(get);
					}

					return get();
				}
			}
		};

		$export({
			directory: function(location) {
				return function(name) {
					var file = $api.fp.now(location, $context.library.file.Location.directory.relativePath(name));
					return {
						get: function() {
							var exists = $context.library.file.Location.file.exists.simple(file);
							if (exists) {
								var sensor = $context.library.file.Location.file.read.stream();
								var entry = $api.fp.world.Sensor.now({
									sensor: sensor,
									subject: file
								});
								if (!entry.present) throw new Error("We already checked!");
								var type = $context.getFilenameMimeType(name);
								var value = entry.value;
								return $api.fp.Maybe.from.some({
									type: type,
									read: function() {
										return value;
									}
								})
							} else {
								return $api.fp.Maybe.from.nothing();
							}
						},
						set: function(v) {
							if (!v) throw new Error("!v!");
							if (!v.read()) throw new Error("!v.read()!");
							var it = $context.library.file.Location.directory.require.old()(location);
							$api.fp.world.Action.now({
								action: it
							});
							var means = $context.library.file.Location.file.write.old(file).stream;
							$api.fp.world.Means.now({
								means: means,
								order: {
									input: v.read()
								}
							});
						}
					}
				}
			},
			finder: fetcher,
			find: find
		});
	}
//@ts-ignore
)($api,$context,$export);
