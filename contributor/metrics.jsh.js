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
		jsh.shell.tools.rhino.require();

		var SLIME = jsh.script.file.parent.parent;

		var code = {
			/** @type { slime.project.metrics.Script } */
			model: jsh.script.loader.script("metrics.js")
		}

		var model = code.model({
			library: {
				file: jsh.file,
				code: jsh.tools.code
			}
		});

		var getSourceFiles = function() {
			return model.getSourceFiles(SLIME);
		};

		var jsapiAnalysis = $api.fp.pipe(
			function(directory) { return directory.pathname.os.adapt(); },
			function(location) {
				return jsh.tools.code.Project.from.directory({
					root: location,
					excludes: {
						descend: function(directory) {
							var basename = jsh.file.Location.basename(directory);
							if (basename == ".git") return false;
							if (basename == "bin") return false;
							if (basename == "local") return false;
							return true;
						},
						isSource: function(file) {
							return $api.fp.Maybe.from.some(true);
						}
					}
				});
			},
			jsh.tools.code.jsapi.analysis
		)

		jsh.script.cli.wrap({
			commands: {
				jsapi: function(invocation) {
					var data = jsapiAnalysis(SLIME);

					[data.fifty, data.jsapi].forEach(function(group) {
						jsh.shell.console(group.name + ": " + group.files + " files, " + group.bytes + " bytes");
						if (group.name == "jsapi") {
							group.list().forEach(function(item) {
								jsh.shell.console(item.path + " " + item.bytes + " tests: " + ( (item.tests.present) ? item.tests.value : "?" ));
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
					 * @returns { { line: number, ignored: string }[] } The lines on which a ts-ignore occurs; lines on the
					 * second-to-last line of a .js file are not included.
					 */
					var getIgnores = function(type,code) {
						var lines = code.split("\n");
						return lines.reduce(function(rv,line,index,array) {
							var indexOf = line.indexOf("@" + "ts-ignore");
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

					var src = getSourceFiles();
					var grouper = $api.fp.Array.groupBy({
						/** @type { (entry: slime.project.metrics.SourceFile) => string } */
						group: function(entry) {
							if (model.SourceFile.isJavascript(entry)) return "js";
							if (model.SourceFile.isTypescript(entry)) return "ts";
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
								var code = entry.file.read(String);
								var covered = (language.group == "ts")
									? true
									: model.SourceFile.javascript.hasTypeChecking(entry)["value"]
								;
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
					jsh.shell.console("Total @" + "ts-ignore comments violating rules: " + ignores.length);
				},
				size: function(invocation) {
					//	TODO	could cache by path so as not to do so much re-reading while sorting etc.
					var getLines = function(file) {
						//	We subtract one because we assume the linter has enforced a trailing newline
						return file.file.read(String).split("\n").length - 1;
					}

					var files = $api.fp.result(
						getSourceFiles(),
						$api.fp.Array.filter($api.fp.Predicate.not(model.SourceFile.isGenerated)),
						$api.fp.Array.filter($api.fp.Predicate.not(model.SourceFile.isJsapi)),
						$api.fp.Array.filter(function(file) {
							return getLines(file) > 500;
						})
					).sort(function(a,b) {
						//	TODO	need fp way to do this
						return getLines(b) - getLines(a);
					});

					files.forEach(function(file) {
						jsh.shell.console(file.path + ": " + getLines(file));
					});

					jsh.shell.console("");
					jsh.shell.console("Total files >500 lines: " + files.length);
				}
			}
		})
	}
//@ts-ignore
)($api,jsh);
