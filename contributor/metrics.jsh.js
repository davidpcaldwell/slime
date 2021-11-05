//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var SLIME = jsh.script.file.parent.parent;

		jsh.script.cli.wrap({
			commands: {
				jsapi: function(invocation) {
					var src = SLIME.list({
						type: jsh.file.list.ENTRY,
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
					var grouper = $api.Function.Array.groupBy({
						group: function(entry) {
							var node = entry.node;
							if (/\.api\.html$/.test(node.pathname.basename)) {
								return "jsapi"
							}
							if (/\.fifty\.ts$/.test(node.pathname.basename)) {
								return "fifty"
							}
							return "unknown";
						}
					});
					var results = grouper(src);

					var size = function(group) {
						return group.array.reduce(function(rv,entry) {
							return rv + entry.node.length;
						},0);
					};

					var fifty = results.find(function(group) {
						return group.group == "fifty";
					});
					var jsapi = results.find(function(group) {
						return group.group == "jsapi";
					});
					[fifty, jsapi].forEach(function(group) {
						jsh.shell.console(group.group + ": " + group.array.length + " files, " + size(group) + " bytes");
						if (group.group == "jsapi") {
							var sized = group.array.map(function(entry) {
								return {
									path: entry.path,
									size: entry.node.length
								}
							}).sort(function(a,b) {
								return b.size - a.size;
							}).map(function(item) {
								return item.path + " " + item.size;
							}).join("\n");
							jsh.shell.console(sized);
						}
						jsh.shell.console("");
					});

					jsh.shell.console("Converted: " + ( size(fifty) / (size(fifty) + size(jsapi)) * 100 ).toFixed(1) + "%");
				}
			}
		})
	}
//@ts-ignore
)($api,jsh);
