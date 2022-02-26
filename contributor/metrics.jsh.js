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
		jsh.shell.tools.rhino.install();

		var SLIME = jsh.script.file.parent.parent;

		var code = {
			/** @type { slime.project.metrics.Script } */
			model: jsh.script.loader.script("metrics.js")
		}

		var model = code.model({
			library: {
				document: jsh.document,
				file: jsh.file
			}
		})

		var getSourceFiles = function() {
			return model.getSourceFiles(SLIME);
		}

		jsh.script.cli.wrap({
			commands: {
				jsapi: function(invocation) {
					var data = model.jsapi(SLIME);

					[data.fifty, data.jsapi].forEach(function(group) {
						jsh.shell.console(group.name + ": " + group.files + " files, " + group.bytes + " bytes");
						if (group["list"]) {
							group["list"].forEach(function(item) {
								jsh.shell.console(item.path + " " + item.bytes);
							})
						}
						jsh.shell.console("");
					});

					jsh.shell.console("Converted: " + ( data.fifty.bytes / (data.fifty.bytes + data.jsapi.bytes) * 100 ).toFixed(1) + "%");
				},
				types: function(invocation) {
					/**
					 *
					 * @param { string } code
					 * @returns { { line: number, ignored: string }[] } The lines on which a @ts-ignore occurs; lines on the
					 * second-to-last line of a .js file are not included.
					 */
					var getIgnores = function(type,code) {
						var lines = code.split("\n");
						return lines.reduce(function(rv,line,index,array) {
							var indexOf = line.indexOf("@ts-ignore");
							var ok = (function() {
								if (type == "js" && index == array.length-3) return true;
								if (type == "ts" && lines[index+1] && lines[index+1].trim() == ")(fifty);") return true;
								return false;
							})();
							if (indexOf != -1 && !ok) {
								rv.push({ line: index+1, ignored: lines[index+1] });
							}
							return rv;
						},[]);
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
					var languages = groups.filter(function(group) {
						return group.group != "other";
					});
					var scans = languages.map(function(language) {
						return {
							language: language.group,
							files: language.array.map(function(entry) {
								var code = entry.node.read(String);
								var covered = isCovered(code);
								return {
									path: entry.path,
									ignores: getIgnores(language.group,code),
									checked: covered,
									lines: code.split("\n").length
								};
							})
						}
					});
					var scripts = scans.find(function(scan) { return scan.language == "js"; }).files.map(function(file) {
						return $api.Object.compose(file, {
							uncovered: (file.checked) ? file.ignores.length : file.lines
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
					jsh.shell.console("Total coverage: " + coverage.covered + "/" + coverage.total + ": " + Number(coverage.covered / coverage.total * 100).toFixed(1) + "%");

					var ignores = scans.reduce(function(rv,scan) {
						return rv.concat(scan.files.reduce(function(s,file) {
							return s.concat(file.ignores.map(function(ignore) {
								return {
									path: file.path,
									line: ignore.line,
									ignored: ignore.ignored
								}
							}))
						}, []));
					},[]);

					jsh.shell.console("");
					ignores.sort(function(a,b) {
						if (a.path < b.path) return -1;
						if (b.path < a.path) return 1;
						if (a.line < b.line) return -1;
						if (b.line < a.line) return 1;
						return 0;
					}).forEach(function(ignore) {
						jsh.shell.console(ignore.path + ":" + ignore.line + ": " + ignore.ignored.trim());
					});
					jsh.shell.console("");
					jsh.shell.console("Total @ts-ignore comments violating rules: " + ignores.length);
				}
			}
		})
	}
//@ts-ignore
)($api,jsh);
