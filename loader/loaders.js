//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.internal.loaders.Scope["toExportScope"] } toExportScope
	 * @param { slime.runtime.internal.loaders.Scope["Loader"] } Loader
	 * @param { slime.loader.Export<slime.runtime.Exports["old"]["loader"]> } $export
	 */
	function(toExportScope,Loader,$export) {
		$export({
			/** @type { slime.runtime.Exports["old"]["loader"]["source"] } */
			source: {
				/** @type { slime.runtime.Exports["old"]["loader"]["source"]["object"] } */
				object: function(o) {
					var getLocation = function(path) {
						var target = o;
						var tokens = path.split("/");
						for (var i=0; i<tokens.length-1; i++) {
							target = target[tokens[i]].loader;
							if (!target) return null;
						}
						return {
							loader: target,
							path: tokens[tokens.length-1]
						};
					};

					return {
						get: function(path) {
							//	TODO	should not return directories
							var location = getLocation(path);
							return (location) ? location.loader[location.path].resource : null;
						},
						list: function(path) {
							var location = getLocation(path);
							if (location.path) throw new Error("Wrong path: [" + path + "]");
							var rv = [];
							for (var x in location.loader) {
								rv.push({
									path: x,
									loader: Boolean(location.loader[x].loader),
									resource: Boolean(location.loader[x].resource)
								});
							}
							return rv;
						}
					}
				}
			},
			series: function(list) {
				var sources = [];
				for (var i=0; i<list.length; i++) {
					sources[i] = list[i].source;
				}
				var source = new function() {
					this.get = function(path) {
						for (var i=0; i<sources.length; i++) {
							var rv = sources[i].get(path);
							if (rv) return rv;
						}
						return null;
					}
				}
				return new Loader(source);
			},
			tools: {
				toExportScope: toExportScope
			},
			from: {
				synchronous: function(synchronous) {
					/** @type { slime.old.loader.Source } */
					var source = {
						get: function(path) {
							var delegate = synchronous.get(path.split("/"));
							if (delegate.present) {
								var code = synchronous.code(delegate.value);
								return {
									name: code.name,
									type: code.type(),
									read: {
										string: code.read
									}
								};
							} else {
								return null;
							}
						},
						list: function(path) {
							var parsed = function(path) {
								if (path.length == 0) return [];
								if (!/\/$/.test(path)) throw new Error("Path must end in /");
								return path.substring(0,path.length-1).split("/");
							}
							var delegate = synchronous.list(parsed(path));
							if (delegate.present) {
								var value = delegate.value;
								return value.map(
									/* @returns { slime.old.loader.source.Entry } */
									function(node) {
										return {
											path: node.name,
											loader: node.parent,
											resource: node.resource
										}
									}
								);
							} else {
								//	TODO	is this right?
								return null;
							}
						}
					};
					return new Loader(source);
				}
			}
		});
	}
//@ts-ignore
)(toExportScope,Loader,$export);
