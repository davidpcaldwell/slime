//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.loader.Scope["methods"] } methods
	 * @param { slime.runtime.internal.loader.Scope["$api"] } $api
	 * @param { slime.old.loader.Export<slime.runtime.internal.loader.Exports> } $export
	 */
	function(methods,$api,$export) {
		var loadScript = function(loader,path) {
			var resource = loader.get(path.split("/"));

			if (resource.present) {
				var code = loader.code(resource.value);

				return function(context) {
					var rv;

					methods.run(
						code,
						{
							$context: context,
							$loader: void(0),
							$export: function(v) {
								rv = v;
							}
						}
					);

					return rv;
				}
			} else {
				return null;
			}
		};

		/**
		 * @type { slime.runtime.loader.Exports }
		 */
		var api = {
			synchronous: {
				scripts: function(loader) {
					return function(path) {
						return loadScript(loader, path);
					}
				},
				resources: function(filter) {
					/**
					 *
					 * @param { slime.runtime.loader.Synchronous<any> } loader
					 * @param { Parameters<slime.runtime.loader.Exports["synchronous"]["resources"]>[0] } filter
					 * @param { string[] } path
					 * @returns
					 */
					var resources = function(loader, filter, path) {
						/** @type { { path: string[], name: string }[] } */
						var rv = [];
						var listing = loader.list(path);
						if (listing.present) {
							listing.value.forEach(function(item) {
								if (item.resource) {
									if (filter.resource(path, item.name)) {
										rv.push({ path: path, name: item.name });
									}
								}
								if (item.parent) {
									if (filter.parent(path.concat([item.name]))) {
										rv = rv.concat(resources(loader, filter, path.concat([item.name])));
									}
								}
							});
							return rv;
						}
						throw new Error("No listing for " + path);
					}

					return function(loader) {
						return resources(loader, filter, []);
					}
				}
			},
			object: {
				Synchronous: function(loader) {
					return {
						script: function(path) {
							return api.synchronous.scripts(loader)(path);
						}
					}
				}
			}
		};

		$export({
			api: api
		});
	}
//@ts-ignore
)(methods,$api,$export);
