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
		jsh.shell.tools.rhino.require.simple();

		var existsFile = $api.fp.world.Sensor.old.mapping({
			sensor: jsh.file.Location.file.exists.world()
		});

		/** @type { (root: slime.jrunscript.file.Location) => slime.tools.code.metrics.Settings } */
		var getSettings = function(root) {
			var toFile = jsh.tools.code.File.from.location(root);

			var location = $api.fp.now.invoke(root, jsh.file.Location.directory.relativePath("metrics.js"));

			var set = existsFile(location);

			/** @type { slime.tools.code.metrics.Settings } */
			var defaults = {
				excludes: {
					descend: function(directory) {
						var basename = jsh.file.Location.basename(directory);
						if (basename == ".git") return false;
						if (basename == "local") return false;
						return true;
					},
					isSource: function(file) {
						return jsh.tools.code.File.isText.basic(toFile(file));
					}
				},
				isGenerated: function(file) {
					return false;
				}
			};

			if (set) {
				//	TODO	switch to new loader when new loader stuff is more mature and easier to use
				var loader = new jsh.file.Loader({ directory: jsh.file.Pathname(root.pathname).directory });
				/** @type { slime.tools.code.metrics.Script } */
				var script = loader.script("metrics.js");
				var settings = script();
				if (!settings.excludes) settings.excludes = defaults.excludes;
				if (!settings.excludes.descend) settings.excludes.descend = defaults.excludes.descend;
				if (!settings.excludes.isSource) settings.excludes.isSource = defaults.excludes.isSource;
				if (!settings.isGenerated) settings.isGenerated = defaults.isGenerated;
				return settings;
			} else {
				return defaults;
			}
		}

		var project = $api.fp.impure.Input.value(
			jsh.shell.PWD.pathname.os.adapt(),
			function(location) {
				var gitRepositoryLocation = $api.fp.now.invoke(location, jsh.file.Location.directory.relativePath(".git"));
				var existsDirectory = $api.fp.world.Sensor.old.mapping({
					sensor: jsh.file.Location.directory.exists.wo
				});
				return {
					root: location,
					git: existsFile(gitRepositoryLocation) || existsDirectory(gitRepositoryLocation)
				}
			},
			function(p) {
				var settings = getSettings(p.root);

				return (
					(p.git)
						//	TODO	this causes a crash when moving files, as files are still listed by git even if they do not
						//			exist anymore
						? jsh.tools.code.Project.from.git({
							root: p.root,
							submodules: false,
							excludes: settings.excludes
						})
						: jsh.tools.code.Project.from.directory({
							root: p.root,
							excludes: settings.excludes
						})
				);
			}
		);

		//	TODO	probably should let this be project-specific
		/** @type { slime.$api.fp.Mapping<slime.tools.code.File,number> } */
		var getPermittedFileSize = function(file) {
			if (jsh.tools.code.File.isFiftyDefinition(file)) return 1000;
			return 500;
		}

		/** @type { slime.$api.fp.Identity<slime.tools.code.File> } */
		var asFile = $api.fp.identity;

		var read = $api.fp.pipe(
			asFile,
			$api.fp.property("file"),
			jsh.file.Location.file.read.string.simple
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
						//	TODO	could cache by path so as not to do so much re-reading while sorting etc.
						/** @type { slime.$api.fp.Mapping<slime.tools.code.File,number> } */
						var getLines = function(file) {
							//	We subtract one because we assume the linter has enforced a trailing newline
							return read(file).split("\n").length - 1;
						}

						var getFiles = $api.fp.impure.Input.map(
							project,
							jsh.tools.code.Project.files
						);

						/** @type { slime.$api.fp.Predicate<slime.tools.code.File> } */
						var isJsapi = function(file) {
							return jsh.tools.code.jsapi.Location.is(file.file);
						}

						var files = $api.fp.now.invoke(
							getFiles(),
							//	TODO	below is awkward and redundant; perhaps input should return project and settings, or project
							//			augmented with settings
							$api.fp.Array.filter($api.fp.Predicate.not(getSettings(project().base).isGenerated)),
							$api.fp.Array.filter($api.fp.Predicate.not(isJsapi)),
							$api.fp.Array.filter(function(file) {
								//	TODO	allow higher limit for Fifty
								return getLines(file) > getPermittedFileSize(file);
							})
						).sort(function(a,b) {
							//	TODO	need fp way to do this
							return getLines(b) / getPermittedFileSize(b) - getLines(a) / getPermittedFileSize(a);
						});

						var percentOver = function(file) {
							var ratio = getLines(file) / getPermittedFileSize(file);
							return ((ratio - 1) * 100).toFixed(1) + "%";
						}

						files.forEach(function(file) {
							jsh.shell.console(file.path + ": " + getLines(file) + " " + percentOver(file));
						});

						jsh.shell.console("");
						jsh.shell.console("Total files exceeding maximum size: " + files.length);
					}
				}
			})
		);
	}
//@ts-ignore
)($api,jsh);
