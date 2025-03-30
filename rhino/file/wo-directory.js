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
	 * @param { slime.jrunscript.file.internal.wo.directory.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.wo.directory.Exports> } $export
	 */
	function($api,$context,$loader,$export) {
		var code = {
			// /** @type { slime.jrunscript.file.internal.java.Script } */
			// java: $loader.script("java.js"),
			/** @type { slime.jrunscript.file.internal.loader.Script } */
			loader: $loader.script("loader.js")
		};

		var loader = code.loader({
			library: {
				Location: $context.Location
			}
		});

		var directory = {
			/** @type { Pick<slime.jrunscript.file.exports.location.Directory,"base"|"relativePath"|"relativeTo"> } */
			navigation: {
				base: function(location) {
					return function(relative) {
						return $context.Location_relative(relative)(location);
					}
				},
				relativePath: $context.Location_relative,
				relativeTo: function(target) {
					/** @type { (reference: slime.jrunscript.file.Location, location: slime.jrunscript.file.Location) => string } */
					var x = function recurse(reference,location) {
						//	TODO	make sure filesystems are the same
						var prefix = reference.pathname + reference.filesystem.separator.pathname;
						if (location.pathname == reference.pathname) {
							return "";
						} else if (location.pathname.substring(0, prefix.length) == prefix)	{
							//	TODO	seriously, make a fp string function for the above comparison
							return location.pathname.substring(prefix.length);
						} else {
							var terms = reference.pathname.split(reference.filesystem.separator.pathname);
							var up = {
								filesystem: reference.filesystem,
								pathname: terms.slice(0, terms.length-1).join(reference.filesystem.separator.pathname)
							};
							return "../" + recurse(up, location);
						}
					}

					return function(location) {
						return x(target, location);
					}
				}
			}
		};

		var wo = {
			directory: {
				/** @type { slime.jrunscript.file.exports.location.Directory["list"]["world"] } */
				list: function(p) {
					/**
					 *
					 * @param { slime.jrunscript.file.Location } location
					 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.Location> } descend
					 * @param { slime.$api.event.Emitter<slime.jrunscript.file.exports.location.list.Events> } events
					 * @returns { slime.jrunscript.file.Location[] }
					 */
					var process = function(location,descend,events) {
						var listed = $api.fp.world.now.ask(
							location.filesystem.listDirectory({ pathname: location.pathname })
						);
						/** @type { slime.jrunscript.file.Location[] } */
						var rv = [];
						if (listed.present) {
							listed.value.forEach(function(name) {
								var it = {
									filesystem: location.filesystem,
									pathname: location.pathname + location.filesystem.separator.pathname + name
								};
								rv.push(it);
								var isDirectory = $api.fp.world.now.question(location.filesystem.directoryExists, { pathname: it.pathname });
								if (isDirectory.present) {
									if (isDirectory.value) {
										if (descend(it)) {
											var contents = process(it,descend,events);
											rv = rv.concat(contents);
										}
									} else {
										//	ordinary file, nothing to do
									}
								} else {
									//	TODO	not exactly the same situation as failing to list the directory, but close enough
									events.fire("failed", it);
								}
							});
						} else {
							events.fire("failed", location);
						}
						return rv;
					};

					return function(events) {
						var descend = (p && p.descend) ? p.descend : $api.fp.Mapping.all(false);
						var array = process(p.target,descend,events);
						return $api.fp.Stream.from.array(array);
					}
				}
			}
		};

		var directoryExists = {
			simple: $api.fp.world.Sensor.mapping({
				sensor: $context.Location_directory_exists
			}),
			world: function() {
				return $context.Location_directory_exists;
			}
		};

		/** @type { slime.jrunscript.file.Exports["Location"]["directory"]["content"]["Index"] } */
		var content_Index = function(root) {
			var separator = root.filesystem.separator.pathname;
			return {
				get: function(path) {
					var target = $api.fp.now(
						root,
						$context.Location_relative(path.join(separator))
					);

					var exists = $api.fp.now(
						target,
						$context.Location.file.exists.simple
					);

					if (exists) {
						return $api.fp.Maybe.from.some(target);
					} else {
						return $api.fp.Maybe.from.nothing();
					}
				},
				list: function(path) {
					var target = $api.fp.now(
						root,
						$context.Location_relative(path.join(separator))
					);

					var targetExists = $api.fp.now(
						target,
						directoryExists.simple
					);

					if (targetExists) {
						var list = list_iterate_simple;
						var rv = $api.fp.now(
							target,
							list,
							$api.fp.Stream.map(function(location) {
								var name = $context.Location_basename(location);
								if ($context.Location.file.exists.simple(location)) return { name: name, value: location };
								//	TODO	not sure why TypeScript requires the spurious value property below
								if (directoryExists.simple(location)) return { name: name, store: content_Index(location), value: void(0) };
								throw new Error();
							}),
							$api.fp.Stream.collect
						);
						return $api.fp.Maybe.from.some(rv);
					} else {
						return $api.fp.Maybe.from.nothing();
					}
				}
			};
		}

		var list_iterate_simple = $api.fp.now(
			$api.fp.world.Sensor.mapping({ sensor: wo.directory.list }),
			$api.fp.curry({ descend: $api.fp.Mapping.all(false) }),
			$api.fp.flatten("target")
		);

		$export({
			base: directory.navigation.base,
			relativePath: directory.navigation.relativePath,
			relativeTo: directory.navigation.relativeTo,
			/** @type { slime.jrunscript.file.exports.Location["directory"]["exists"] } */
			exists: directoryExists,
			require: function(p) {
				return function(location) {
					return function(events) {
						var exists = location.filesystem.directoryExists({
							pathname: location.pathname
						})(events);
						if (exists.present) {
							if (!exists.value) {
								if (p && p.recursive) {
									$api.fp.world.now.action(
										$context.ensureParent,
										location,
										{
											created: function(e) {
												events.fire("created", {
													filesystem: location.filesystem,
													pathname: e.detail
												})
											}
										}
									);
								}
								$api.fp.world.now.action(
									location.filesystem.createDirectory,
									{ pathname: location.pathname }
								)
								//	TODO	should push this event back into implementation
								//			this way, we could inform of recursive creations as well
								//			probably in the implementation, payload should be pathname, translated into
								//			location at this layer
								events.fire("created", location);
							} else {
								events.fire("found", location);
							}
						} else {
							throw new Error("Error determining whether directory is present at " + location.pathname);
						}
					}
				}
			},
			/** @type { slime.jrunscript.file.exports.Location["directory"]["remove"] } */
			remove: {
				world: function() {
					return $context.remove;
				},
				simple: $api.fp.world.Means.output({
					means: $context.remove
				})
			},
			list: (
				function() {
					return {
						world: wo.directory.list,
						iterate: {
							simple: list_iterate_simple
						},
						stream: {
							world: function(configuration) {
								return function(location) {
									return wo.directory.list({
										target: location,
										descend: (configuration && configuration.descend) ? configuration.descend : $api.fp.Mapping.all(false)
									});
								}
							},
							simple: function(configuration) {
								return function(location) {
									return $api.fp.world.Sensor.now({
										sensor: wo.directory.list,
										subject: {
											target: location,
											descend: (configuration && configuration.descend) ? configuration.descend : $api.fp.Mapping.all(false)
										}
									});
								}
							}
						}
					}
				}
			)(),
			loader: {
				synchronous: function(p) {
					return loader.create(p.root);
				}
			},
			content: {
				Index: content_Index
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
