//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.runtime.Exports["loader"]["tools"]["toExportScope"] } toExportScope
	 * @param { slime.runtime.internal.LoaderConstructor } Loader
	 * @param { (value: slime.runtime.Exports["loader"]) => void } $export
	 */
	function(toExportScope,Loader,$export) {
		$export({
			/** @type { slime.runtime.Exports["Loader"]["source"] } */
			source: {
				/** @type { slime.runtime.Exports["Loader"]["source"]["object"] } */
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
			}
		});
	}
//@ts-ignore
)(toExportScope,Loader,$export);
