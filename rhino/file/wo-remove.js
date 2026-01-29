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
	 * @param { slime.jrunscript.file.remove.internal.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.remove.internal.Exports> } $export
	 */
	function($api,$context,$export) {
		var Location_directory_exists = $context.Location_directory_exists;
		var Location_file_exists = $context.Location_file_exists;

		/** @type { slime.jrunscript.file.remove.File["wo"] } */
		var Location_file_remove = function(p) {
			return function(events) {
				var success = p.filesystem.remove.file({ pathname: p.pathname })(events);
				return success;
			}
		}

		/** @type { slime.jrunscript.file.remove.Directory["wo"] } */
		var Location_directory_remove = function(p) {
			return function(events) {
				var success = p.filesystem.remove.directory({ pathname: p.pathname })(events);
				return success;
			}
		}

		/** @type { slime.jrunscript.file.remove.internal.Exports["location"] } */
		var location = function(settings) {
			return function remove(location) {
				var is = {
					directory: $api.fp.now(Location_directory_exists, $api.fp.world.Sensor.mapping()),
					file: $api.fp.now(Location_file_exists, $api.fp.world.Sensor.mapping()),
					symlink: $api.fp.now($context.Location_is_symlink, $api.fp.world.Sensor.mapping())
				};

				var recursive = (settings && settings.recursive) ? settings.recursive : false;

				var known = (function(given) {
					if (typeof(given) == "undefined") return true;
					if (typeof(given) == "boolean") return given;
					throw new TypeError();
				})( (settings || {}).known);

				return function(events) {
					if (!is.directory(location) && !is.file(location) && !is.symlink(location) && known) {
						events.fire("notFound");
						return $api.fp.Maybe.from.nothing();
					}

					events.fire("removing", location);

					if (is.directory(location)) {
						var listing = $api.fp.now(
							location,
							$context.list_stream().simple
						);

						var empty = $api.fp.now(
							listing,
							$api.fp.Stream.first,
							$api.fp.now(
								$api.fp.property("present"),
								$api.fp.Predicate.not
							)
						);

						if (!recursive) {
							if (!empty) {
								events.fire("notEmpty");
								return $api.fp.Maybe.from.nothing();
							}
						} else {
							var isSymlink = $api.fp.now(
								location.filesystem.isSymlink,
								$api.fp.world.Sensor.mapping()
								//	TODO	Partial impure
							);
							var checkForSymlink = isSymlink(location);
							if (!checkForSymlink.present) throw new Error("Could not determine whether " + location.pathname + " is a symlink");
							if (!checkForSymlink.value) {
								$api.fp.now(
									listing,
									function(stream) {
										$api.fp.impure.Stream.forEach(function(location) {
											var success = remove(location)(events);
											if (!success.present) return $api.fp.Maybe.from.nothing();
										})(stream);
										return void(0);
									}
								)
							}
						}
					}

					var operation;
					if (is.directory(location)) {
						operation = location.filesystem.remove.directory;
					} else if (is.file(location)) {
						operation = location.filesystem.remove.file;
					} else if (is.symlink(location)) {
						operation = location.filesystem.remove.file;
					}

					var success = operation({ pathname: location.pathname })(events);
					if (success.present) { events.fire("removed", location); }
					return (success) ? $api.fp.Maybe.from.some(void(0)) : $api.fp.Maybe.from.nothing();
				};
			}
		};

		$export({
			file: Location_file_remove,
			directory: Location_directory_remove,
			location: location,
			os: {
				location: function(settings) {
					return function(pathname) {
						return function(events) {
							var it = location(settings);
							var result = $api.fp.world.Sensor.now({
								sensor: it,
								subject: $context.os.codec.encode(pathname),
								//	TODO	how can we simplify the below?
								handlers: {
									error: function(e) { events.fire("error", e.detail); },
									notEmpty: function(e) { events.fire("notEmpty"); },
									notFound: function(e) { events.fire("notFound"); },
									removed: function(e) { events.fire("removed", e.detail.pathname); },
									removing: function(e) { events.fire("removing", e.detail.pathname); }
								}
							});
							return result;
						}
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
