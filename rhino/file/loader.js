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
	 * @param { slime.jrunscript.file.internal.loader.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.file.internal.loader.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.jrunscript.file.internal.loader.Exports["create"] } */
		var adapt = function(delegate) {
			var exists = $api.fp.world.mapping($context.library.Location.file.exists());

			return {
				get: function(path) {
					var target = $context.library.Location.relative(path.join(delegate.filesystem.separator.pathname))(delegate);
					if (exists(target)) {
						/** @type { slime.jrunscript.file.internal.loader.Resource } */
						var resource = {
							name: target.pathname,
							read: function() {
								var maybe = $api.fp.world.now.ask(
									target.filesystem.openInputStream({ pathname: target.pathname })
								)
								if (!maybe.present) throw new Error();
								return maybe.value;
							},
							length: function() {
								return $api.fp.world.now.ask(
									target.filesystem.fileLength({ pathname: target.pathname })
								);
							},
							modified: function() {
								return $api.fp.world.now.ask(
									target.filesystem.fileLastModified({ pathname: target.pathname })
								);
							}
						}
						return $api.fp.Maybe.from.some(resource)
					} else {
						return $api.fp.Maybe.from.nothing();
					}
				},
				list: function(path) {
					var target = $context.library.Location.relative(path.join(delegate.filesystem.separator.pathname))(delegate);
					var nodes = $api.fp.world.now.ask(target.filesystem.listDirectory({ pathname: target.pathname }));
					if (!nodes.present) throw new Error();
					return $api.fp.Maybe.from.some(
						nodes.value.map(
							/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.world.spi.Node,slime.runtime.loader.Node> } */
							function(node) {
								return {
									name: node.name,
									parent: node.type == "directory",
									resource: node.type == "file"
								}
							}
						)
					);
				},
				code: function(resource) {
					return {
						name: resource.name,
						type: function() {
							return $api.mime.Type.fromName(resource.name);
						},
						read: function() {
							//	TODO	is there a better API for this now? For converting input stream to string?
							//	TODO	alternatively, we already have a file system node earlier, and we have a way to convert
							//			*that* to a string, but it's not available here (as our argument is a resource); we could
							//			include a Location object instead of the name
							return resource.read().character().asString();
						}
					}
				}
			};
		}

		$export({
			create: adapt
		});
	}
//@ts-ignore
)($api,$context,$export);
