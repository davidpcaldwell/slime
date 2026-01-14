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
	 * @param { slime.runtime.Platform } $platform
	 * @param { slime.jrunscript.file.internal.wo.directory.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.wo.directory.Exports> } $export
	 */
	function($api,$platform,$context,$loader,$export) {
		/** @type { (fs: slime.jrunscript.file.world.Filesystem) => slime.$api.fp.Transform<string> } */
		var canonicalize = function(filesystem) {
			return function(pathname) {
				var terms = pathname.split(filesystem.separator.pathname);
				var rv = [];
				var RETURN_NULL = false;
				terms.forEach(function(term) {
					if (RETURN_NULL) return;
					if (term == ".") {
						return;
					} else if (term == "..") {
						//	TODO	This seems brittle but causes tests to pass on UNIX-like filesystems. Probably need to revisit.
						if (rv.length == 1 && rv[0] === "") {
							RETURN_NULL = true;
							return;
						} else {
							rv.pop();
						}
					} else {
						rv.push(term);
					}
				});
				return (RETURN_NULL) ? null : rv.join(filesystem.separator.pathname);
			}
		};

		/** @type { <T>(f: (location: slime.jrunscript.file.Location) => T) => (location: string) => T } */
		var osParameter = function(f) {
			return function(string) {
				return f({
					filesystem: $context.filesystem.os,
					pathname: string
				});
			}
		};

		/**
		 *
		 * @type { <T>(f: (t: T) => slime.jrunscript.file.Location) => (t: T) => string } f
		 */
		var osResult = function(f) {
			return function(t) {
				var rv = f(t);
				return rv.pathname;
			};
		};

		/** @type { (path: string) => (location: slime.jrunscript.file.Location) => slime.jrunscript.file.Location } */
		var Location_relative_location = function(path) {
			return function(location) {
				var absolute = location.pathname + location.filesystem.separator.pathname + path;
				var canonical = canonicalize(location.filesystem)(absolute);
				if (canonical === null) return null;
				return {
					filesystem: location.filesystem,
					pathname: canonical
				}
			}
		};

		/** @type { slime.jrunscript.file.internal.wo.directory.Exports["Location_relative_os"] } */
		var Location_relative_os = function(path) {
			return osParameter(osResult(Location_relative_location(path)));
		};

		/** @type { slime.jrunscript.file.location.Exports["parent"] } */
		var Location_parent = function() {
			return Location_relative_location("..");
		};

		/** @type { ReturnType<slime.jrunscript.file.Exports["Location"]["directory"]["exists"]["world"]> } */
		var Location_directory_exists = function(location) {
			return function(events) {
				var rv = location.filesystem.directoryExists({
					pathname: location.pathname
				})(events);
				if (rv.present) return rv.value;
				throw new Error("Error determining whether directory is present at " + location.pathname);
			}
		}

		/** @type { slime.$api.fp.world.Means<slime.jrunscript.file.Location, { created: slime.jrunscript.file.Location }> } */
		var ensureParent = function(location) {
			var it = function(location,events) {
				var parent = Location_relative_location("..")(location);
				var exists = Location_directory_exists(parent)(events);
				if (!exists) {
					it(parent, events);
					$api.fp.world.now.action(
						location.filesystem.createDirectory,
						{ pathname: parent.pathname }
					);
					events.fire("created", parent);
				}
			};

			return function(events) {
				it(location,events);
			}
		}

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
			/** @type { Pick<slime.jrunscript.file.location.directory.Exports,"base"|"relativePath"|"relativeTo"> } */
			navigation: {
				base: function(location) {
					return function(relative) {
						return Location_relative_location(relative)(location);
					}
				},
				relativePath: Location_relative_location,
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
				/** @type { slime.jrunscript.file.location.directory.Exports["list"]["world"] } */
				list: function(p) {
					/**
					 *
					 * @param { slime.jrunscript.file.Location } location
					 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.Location> } descend
					 * @param { slime.$api.event.Producer<slime.jrunscript.file.location.directory.list.Events> } events
					 * @returns { slime.jrunscript.file.Location[] }
					 */
					var process = function(location,descend,events) {
						if (!location.filesystem) throw new TypeError("No filesystem for location " + location);
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
			simple: $api.fp.world.Sensor.old.mapping({ sensor: Location_directory_exists }),
			world: function() { return Location_directory_exists; }
		};

		/**
		 *
		 * @param { slime.jrunscript.file.Location } location
		 * @param { slime.$api.fp.world.Order<ReturnType<slime.jrunscript.file.location.directory.Exports["require"]>["wo"]> } p
		 * @returns { ReturnType<ReturnType<slime.jrunscript.file.location.directory.Exports["require"]>["wo"]> }
		 */
		var require_shared = function(location,p) {
			return function(events) {
				var exists = location.filesystem.directoryExists({
					pathname: location.pathname
				})(events);
				if (exists.present) {
					if (!exists.value) {
						if (p && p.recursive) {
							$api.fp.world.now.action(
								ensureParent,
								location,
								{
									created: function(e) {
										events.fire("created", {
											filesystem: location.filesystem,
											pathname: e.detail.pathname
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
		};

		/** @type { (location: slime.jrunscript.file.Location) => ReturnType<slime.jrunscript.file.Exports["Location"]["directory"]["require"]>["wo"] } */
		var require = function(location) {
			return function(p) {
				return require_shared(location,p);
			}
		}

		/** @type { slime.jrunscript.file.Exports["Location"]["directory"]["require"]["old"] } */
		var require_old = function(p) {
			return function(location) {
				return require_shared(location,p);
			}
		};

		/** @type { slime.jrunscript.file.Exports["Location"]["directory"]["content"]["Index"] } */
		var content_Index = function(root) {
			var separator = root.filesystem.separator.pathname;
			return {
				get: function(path) {
					var target = $api.fp.now(
						root,
						Location_relative_location(path.join(separator))
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
						Location_relative_location(path.join(separator))
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
		};

		/** @type { slime.jrunscript.file.Exports["Location"]["directory"]["content"]["mirror"] } */
		var content_mirror = function(p) {
			return function(events) {
				/** @type { (path: string[]) => void } */
				var process = function(path) {
					var destination = Location_relative_location(path.join(p.to.filesystem.separator.pathname))(p.to);

					var entries = p.index.list(path);
					if (!entries.present) return;
					entries.value.forEach(function(entry) {
						if ($api.content.Entry.is.IndexEntry(entry)) {
							process(path.concat([entry.name]));
						} else {
							var target = Location_relative_location(entry.name)(destination);
							var parent = Location_parent()(target);
							if (!directoryExists.simple(parent)) {
								$api.fp.world.Means.now({
									means: require_old({ recursive: true }),
									order: parent
								});
							}
							var write = $context.Location_file_write(target);
							p.write({
								file: entry.value,
								api: write
							});
							events.fire("mirrored", target);
						}
					});
				};

				process([]);
			}
		}

		var list_iterate_simple = $api.fp.now(
			$api.fp.world.Sensor.old.mapping({ sensor: wo.directory.list }),
			$api.fp.curry({ descend: $api.fp.Mapping.all(false) }),
			$api.fp.flatten("target")
		);

		$export({
			base: directory.navigation.base,
			relativePath: directory.navigation.relativePath,
			relativeTo: directory.navigation.relativeTo,
			/** @type { slime.jrunscript.file.location.Exports["directory"]["exists"] } */
			exists: directoryExists,
			require: Object.assign(
				function(location) {
					var means = require(location);
					return $api.fp.world.Means.api.simple(means)
				},
				{
					old: require_old
				}
			),
			/** @type { slime.jrunscript.file.location.Exports["directory"]["remove"] } */
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
				Index: content_Index,
				mirror: content_mirror
			},
			Loader: {
				simple: function(root) {
					/**
					 *
					 * @param { slime.jrunscript.file.Location } t
					 * @returns { slime.runtime.loader.Code }
					 */
					var adapt = function(t) {
						if (!t.pathname) throw new TypeError("Not location: " + t);
						return {
							name: t.pathname,
							type: function() {
								return $api.mime.Type.fromName( $context.Location_basename(t) )
							},
							read: function() {
								return $context.Location_file_read_string.simple(t);
							}
						}
					};

					return $context.Store.content({
						//	@notdry Search for all instances of Store.content and have them share implementation
						store: content_Index(
							root
						),
						compiler: function(location) {
							if (!location.pathname) throw new Error("Not location: keys = " + Object.keys(location));
							return $api.scripts.compiler(adapt(location))
						},
						unsupported: function(code) { return null; },
						scope: {
							$api: $api,
							$platform: $platform
						}
					})
				}
			},
			ensureParent: ensureParent,
			Location_relative: Location_relative_location,
			Location_parent: Location_parent,
			Location_directory_exists: directoryExists,
			Location_relative_os: Location_relative_os
		})
	}
//@ts-ignore
)($api,$platform,$context,$loader,$export);
