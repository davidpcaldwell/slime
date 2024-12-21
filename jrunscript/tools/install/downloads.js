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
			return $api.fp.world.Sensor.mapping({
				sensor: client,
				handlers: {
					request: function(e) {
						events.fire("request", e.detail);
					}
				}
			});
		}

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
							var it = $context.library.file.Location.directory.require()(location);
							$api.fp.world.Action.now({
								action: it
							});
							var means = $context.library.file.Location.file.write(file).stream;
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
			finder: fetcher
		});
	}
//@ts-ignore
)($api,$context,$export);
