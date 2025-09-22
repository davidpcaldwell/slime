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
	 * @param { slime.jrunscript.file.internal.archive.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.archive.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			zip: {
				map: function(base) {
					var paths = $context.library.file.Location.directory.relativeTo(base);
					var read = $api.fp.now(
						$context.library.file.Location.file.read.stream(),
						$api.fp.world.Sensor.mapping(),
						function(mapping) {
							return function(location) {
								var rv = mapping(location);
								if (!rv.present) throw new Error();
								return rv.value;
							}
						}
					);
					return function(location) {
						$api.TODO()();
						var dir = $context.library.file.Location.directory.exists.simple(location);
						return {
							path: paths(location),
							comment: void(0),
							time: {
								modified: $api.fp.Maybe.from.nothing(),
								created: $api.fp.Maybe.from.nothing(),
								accessed: $api.fp.Maybe.from.nothing()
							},
							content: (dir) ? void(0) : read(location)
						}
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
