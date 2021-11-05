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

		var getSourceFiles = function() {
			return SLIME.list({
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
		}

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
				},
				types: function(invocation) {
					var getIgnores = function(code) {
						var lines = code.split("\n");
						return lines.reduce(function(rv,line,index,array) {
							var indexOf = line.indexOf("@ts-ignore");
							if (indexOf != -1 && index != array.length - 3) {
								rv++;
							}
							return rv;
						},0);
					};

					var isCovered = function(code) {
						return code.indexOf("ts-check") != -1;
					}

					var src = getSourceFiles();
					var grouper = $api.Function.Array.groupBy({
						group: function(entry) {
							if (/\.js$/.test(entry.path)) return "js";
							if (/\.ts$/.test(entry.path)) return "ts";
							return "other";
						}
					});
					var groups = grouper(src);
					var js = groups.find(function(group) {
						return group.group == "js";
					});
					var ts = groups.find(function(group) {
						return group.group == "ts";
					});
					var scripts = js.array.map(function(entry) {
						var code = entry.node.read(String);
						var covered = isCovered(code);
						return {
							path: entry.path,
							ignores: getIgnores(code),
							checked: covered,
							lines: code.split("\n").length
						};
					}).map(function(file) {
						return $api.Object.compose(file, {
							uncovered: (file.checked) ? file.ignores : file.lines
						});
					}).filter(function(file) {
						return file.uncovered > 0;
					}).sort(function(a,b) {
						return b.uncovered - a.uncovered;
					});
					jsh.shell.console(scripts.map(function(script) {
						return script.path + ": " + script.uncovered;
					}).join("\n"));
					var coverage = scripts.reduce(function(rv,script) {
						rv.covered += script.lines - script.uncovered;
						rv.total += script.lines;
						return rv;
					}, {
						covered: 0,
						total: 0
					});
					jsh.shell.console("Total covereage: " + coverage.covered + "/" + coverage.total + ": " + Number(coverage.covered / coverage.total * 100).toFixed(1) + "%");
				}
			}
		})
	}
//@ts-ignore
)($api,jsh);
