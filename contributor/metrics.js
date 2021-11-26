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
	 * @param { slime.project.metrics.Context } $context
	 * @param { slime.loader.Export<slime.project.metrics.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jrunscript.file.Directory } base
		 * @returns
		 */
		function getSourceFiles(base) {
			return base.list({
				type: $context.library.file.list.ENTRY,
				filter: function(item) {
					if (item.pathname.basename == ".git") return false;
					if (item.pathname.basename == "local") return false;
					if (item.directory) return false;
					return true;
				},
				descendants: function(dir) {
					if (dir.pathname.basename == ".git") return false;
					if (dir.pathname.basename == "local") return false;
					return true;
				}
			});
		}

		var size = function(group) {
			return group.array.reduce(function(rv,entry) {
				return rv + entry.node.length;
			},0);
		};

		$export({
			getSourceFiles: getSourceFiles,
			jsapi: function(base) {
				var src = getSourceFiles(base);
				var grouper = $api.Function.Array.groupBy({
					group: function(entry) {
						var node = entry.node;
						if (node.pathname.basename == "api.html" || /\.api\.html$/.test(node.pathname.basename)) {
							return "jsapi"
						}
						if (/\.fifty\.ts$/.test(node.pathname.basename)) {
							return "fifty"
						}
						return "unknown";
					}
				});
				var results = grouper(src);

				var fifty = results.find(function(group) {
					return group.group == "fifty";
				});
				var jsapi = results.find(function(group) {
					return group.group == "jsapi";
				});
				return {
					fifty: {
						name: "fifty",
						files: fifty.array.length,
						bytes: size(fifty)
					},
					jsapi: {
						name: "jsapi",
						files: jsapi.array.length,
						bytes: size(jsapi),
						list: (function() {
							return jsapi.array.map(function(entry) {
								return {
									path: entry.path,
									bytes: entry.node.length
								}
							}).sort(function(a,b) {
								return b.bytes - a.bytes;
							});
						})()
					}
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
