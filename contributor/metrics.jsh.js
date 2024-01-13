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
		$api.fp.world.now.tell(jsh.shell.tools.rhino.require());

		/** @deprecated Should be able to use `project`. */
		var SLIME = jsh.script.file.parent.parent;

		var project = $api.fp.impure.Input.value(
			{
				root: SLIME.pathname.os.adapt()
			},
			jsh.tools.code.Project.from.git
		);

		/** @type { slime.$api.fp.Identity<slime.tools.code.File> } */
		var asFile = $api.fp.identity;

		var read = $api.fp.pipe(
			asFile,
			$api.fp.property("file"),
			jsh.file.Location.file.read.string.assert
		);

		jsh.script.cli.main(
			jsh.script.cli.program({
				commands: {
					jsapi: $api.fp.impure.Output.map({
						map: $api.fp.impure.Input.mapping.all(project),
						output: jsh.tools.code.jsapi.report({
							line: jsh.shell.console
						})
					}),
					types: function(invocation) {
						var scans = $api.fp.now.invoke(
							project(),
							jsh.tools.code.Project.files,
							$api.fp.Array.groupBy({
								/** @type { (entry: slime.tools.code.File) => string } */
								group: function(entry) {
									if (jsh.tools.code.File.isJavascript(entry)) return "js";
									if (jsh.tools.code.File.isTypescript(entry)) return "ts";
									return "other";
								}
							}),
							$api.fp.Array.filter(function(group) {
								return group.group != "other";
							}),
							$api.fp.Array.map(function(language) {
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

								return {
									language: language.group,
									files: language.array.map(function(entry) {
										var code = read(entry);
										var covered = (language.group == "ts")
											? true
											: jsh.tools.code.File.javascript.hasTypeChecking(entry)["value"]
										;
										return {
											path: entry.path,
											ignores: getIgnores(language.group,code),
											checked: covered,
											lines: code.split("\n").length
										};
									})
								}
							})
						);

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
						var code = {
							/** @type { slime.project.metrics.Script } */
							project: jsh.script.loader.script("metrics.js")
						};

						var project = code.project({
							library: {
								file: jsh.file,
								code: jsh.tools.code
							}
						});

						/** @deprecated Use slime.tools.code constructs. */
						var getSourceFiles = function() {
							return project.getSourceFiles(SLIME);
						};

						//	TODO	could cache by path so as not to do so much re-reading while sorting etc.
						var getLines = function(file) {
							//	We subtract one because we assume the linter has enforced a trailing newline
							return file.file.read(String).split("\n").length - 1;
						}

						var files = $api.fp.result(
							getSourceFiles(),
							$api.fp.Array.filter($api.fp.Predicate.not(project.SourceFile.isGenerated)),
							$api.fp.Array.filter($api.fp.Predicate.not(project.SourceFile.isJsapi)),
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
		);
	}
//@ts-ignore
)($api,jsh);
