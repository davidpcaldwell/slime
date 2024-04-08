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
				list: {
					/** @type { slime.jrunscript.file.exports.location.Directory["list"]["stream"]["world"] } */
					stream: function(p) {
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

						return function(location) {
							return function(events) {
								var descend = (p && p.descend) ? p.descend : $api.fp.Mapping.all(false);
								var array = process(location,descend,events);
								return $api.fp.Stream.from.array(array);
							}
						}
					}
				}
			}
		};

		$export({
			base: directory.navigation.base,
			relativePath: directory.navigation.relativePath,
			relativeTo: directory.navigation.relativeTo,
			/** @type { slime.jrunscript.file.exports.Location["directory"]["exists"] } */
			exists: {
				simple: $api.fp.world.Sensor.mapping({
					sensor: $context.Location_directory_exists
				}),
				world: function() {
					return $context.Location_directory_exists;
				}
			},
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
			list: {
				stream: {
					world: wo.directory.list.stream,
					simple: function(configuration) {
						return $api.fp.world.Sensor.mapping({ sensor: wo.directory.list.stream(configuration) });
					}
				}
			},
			loader: {
				synchronous: function(p) {
					return loader.create(p.root);
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$loader,$export);
