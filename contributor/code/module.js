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
	 * @param { slime.project.code.Context } $context
	 * @param { slime.loader.Export<slime.project.code.Exports> } $export
	 */
	function($api,$context,$export) {
		//	Was support code for dealing with line endings
		// var source = new function() {
		// 	this.endings = function(p) {
		// 		if (p.eol == "\n") {
		// 			if (p.string || typeof(p.string) == "string") {
		// 				var lines = p.string.split("\n");
		// 				var array = [];
		// 				var matcher = /(.*)\r$/;
		// 				lines.forEach(function(item) {
		// 					if (matcher.exec(item)) {
		// 						array.push(matcher.exec(item)[1]);
		// 					} else {
		// 						array.push(item);
		// 					}
		// 				});
		// 				return array.join("\n");
		// 			} else {
		// 				throw new Error("Unknown format: p.string is missing.");
		// 			}
		// 		} else {
		// 			throw new Error("Unimplemented: setting eol to " + p.eol);
		// 		}
		// 	}
		// }

		var files = (
			/**
			 *
			 * @returns { slime.project.code.Exports["files"] }
			 */
			function() {
				var isVscodeJavaExtensionDirectory = function(directory) {
					return directory.pathname.basename == "bin"
						|| directory.pathname.basename == ".settings"
				};

				//	TODO	obviously this is not ideal
				var getBasename = function(location) {
					return $context.library.file.Pathname(location.pathname).basename;
				}

				/** @type { slime.tools.code.isText } */
				var isText = $api.fp.series(
					function(entry) {
						if (entry.path == "contributor/docker-compose-run") return true;
						if (entry.path == "tools/wf/test/data/plugin-standard/wf") return true;
					},
					function added(entry) {
						if (/\.rc$/.test(entry.path)) return true;
					},
					function wasFromWf(entry) {
						if (/\.def$/.test(entry.path)) return true;
						if (/\.prefs$/.test(entry.path)) return true;
						if (/\.py$/.test(entry.path)) return true;
						if (/\.yaml$/.test(entry.path)) return true;
						if (/\.yml$/.test(entry.path)) return true;

						if (entry.path == ".hgsub") return true;
						if (entry.path == ".hgignore") return true;
						if (entry.path == ".gitignore") return true;

						//	Really should ignore these files because they are VCS-ignored, not because they are binary
						if (entry.path == ".classpath") return false;
						if (entry.path == ".project") return false;
						if (entry.path == ".hgsubstate") return false;

						if (entry.path == "documentation") return true;
						if (entry.path == "fifty") return true;
						if (entry.path == "wf") return true;
						if (entry.path == "tools/wf") return true;
						if (entry.path == "LICENSE") return true;
						if (entry.path == "contributor/hooks/pre-commit") return true;
					},
					function wasFromDevelopScript(entry) {
						if (entry.path == ".hgsub") return true;
						if (entry.path == ".hgsubstate") return false;
						if (entry.path == ".hgignore") return false;
					},
					function wasFromPrecommit(entry) {
						if (/\.def$/.test(entry.path)) return true;
						if (/\.prefs$/.test(entry.path)) return true;
						if (entry.path == ".hgsub") return true;
						if (entry.path == ".hgsubstate") return false;
						if (entry.path == ".hgignore") return false;
						if (entry.path == ".gitignore") return false;
						if (entry.path == "contributor/hooks/pre-commit") return true;
						if (entry.path == ".classpath") return false;
						if (entry.path == ".project") return false;
						if (entry.path == "contribute") return true;
						if (entry.path == "tools/wf") return true;
						if (entry.path == "wf") return true;
					},
					$api.fp.pipe(
						$context.library.code.File.isText.basic,
						function(maybe) {
							if (maybe.present) return maybe.value;
						}
					),
					function(entry) {
						var basename = getBasename(entry.file);
						//	Project-specific extensions
						//	TODO	should be able to rename this one and get rid of it
						if (/\.jsh$/.test(basename)) return true;

						//	Seems to be a SLIME-ism, probably should use shebang to determine this
						if (/\.bash$/.test(basename)) return true;

						//	TODO	if license.js has a license for the file, should always return true; we are repeating information

						//	This is a specific project file of test data for a ServiceLoader-related test
						if (/META-INF\/services\/java.lang.Runnable$/.test(entry.file.pathname.toString())) return false;
					}
				)

				// var isTexts = (
				// 	function() {
				// 		// var options = function(options) {
				// 		// 	var extensions = {};
				// 		// 	var specified = {};
				// 		// 	options.text.forEach(function(path) {
				// 		// 		if (path.substring(0,1) == ".") {
				// 		// 			extensions[path.substring(1)] = true;
				// 		// 		} else {
				// 		// 			specified[path] = true;
				// 		// 		}
				// 		// 	});
				// 		// 	options.binary.forEach(function(path) {
				// 		// 		if (path.substring(0,1) == ".") {
				// 		// 			extensions[path] = false;
				// 		// 		} else {
				// 		// 			specified[path] = false;
				// 		// 		}
				// 		// 	});
				// 		// 	return function(entry) {
				// 		// 		if (typeof(specified[entry.path]) != "undefined") return specified[entry.path];
				// 		// 		var extension = (function() {
				// 		// 			var tokens = entry.node.pathname.basename.split(".");
				// 		// 			if (tokens.length > 1) {
				// 		// 				return tokens[tokens.length-1];
				// 		// 			} else {
				// 		// 				return null;
				// 		// 			}
				// 		// 		})();
				// 		// 		if (extension && typeof(extensions[extension]) != "undefined") {
				// 		// 			return extensions[extension];
				// 		// 		}
				// 		// 	}
				// 		// }

				// 		return {
				// 			// options: options
				// 		}
				// 	}
				// )();

				//	Appears to have been code to fix line endings
				// var endings = function(p) {
				// 	forEachTextEntry({
				// 		base: p.base,
				// 		isText: p.isText,
				// 		entry: function(entry) {
				// 			var code = entry.node.read(String);
				// 			var revised = source.endings({ eol: p.eol, string: code })
				// 			if (code != revised) {
				// 				p.on.changed(entry);
				// 				if (!p.nowrite) {
				// 					entry.node.pathname.write(revised, { append: false });
				// 				}
				// 			} else {
				// 				p.on.unchanged(entry);
				// 			}
				// 		},
				// 		on: {
				// 			unknownFileType: (p.on && p.on.unknownFileType) ? p.on.unknownFileType : function(){}
				// 		}
				// 	});
				// }

				var toHandler = function(on) {
					return {
						unknownFileType: function(e) {
							if (on && on.unknownFileType) on.unknownFileType(e.detail);
						},
						foundAt: function(e) {
							if (on && on.change) on.change(e.detail);
						},
						foundIn: function(e) {
							if (on && on.changed) on.changed(e.detail);
						},
						notFoundIn: function(e) {
							if (on && on.unchanged) on.unchanged(e.detail);
						}
					}
				}

				var excludes = {
					directory: $api.fp.Predicate.or(
						$context.library.code.defaults.exclude.directory,
						isVscodeJavaExtensionDirectory
					)
				};

				/** @type { slime.project.code.Exports["files"]["trailingWhitespace"] } */
				var trailingWhitespace = function(p) {
					//	TODO	return the Tell and have callers do normal event handling
					return $context.library.code.handleDirectoryTrailingWhitespace({
						base: p.base,
						exclude: excludes,
						isText: isText,
						nowrite: p.nowrite
					});
				}

				return {
					exclude: excludes,
					isText: isText,
					trailingWhitespace: trailingWhitespace,
					toHandler: toHandler
				}
			}
		)();

		$export({
			files: files,
			directory: {
				lastModified: function(p) {
					return $api.fp.result(
						p.loader,
						$api.fp.pipe(
							$context.library.io.loader.entries({
								filter: {
									resource: function(path, name) {
										return true;
									},
									parent: function(path) {
										if (path.length == 1 && path[0] == ".git") return false;
										if (path.length == 1 && path[0] == "local") return false;
										if (path.length == 1 && path[0] == "bin") return false;
										return true;
									}
								},
								map: p.map
							}),
							$api.fp.Ordering.array.first($context.library.io.Entry.mostRecentlyModified()),
							$api.fp.Maybe.map(function(latest) {
								return latest.resource.modified();
							}),
							function(it) {
								if (it.present) return it.value;
								return $api.fp.Maybe.from.nothing();
							}
						)
					);
				}
			},
			git: {
				lastModified: function(p) {
					//	TODO	would this notice untracked files? Should it?
					var files = $context.library.git.program({ command: "git" })
						.repository(p.base)
						.command($context.library.git.commands.lsFiles)
						.argument({ recurseSubmodules: true })
						.run()
					;

					//	TODO	redundant with lsFilesOthers in tools/code. Perhaps should become standard git command
					/** @type { slime.jrunscript.tools.git.Command<void,string[]> } */
					var lsFilesOthers = {
						invocation: function() {
							return {
								command: "ls-files",
								arguments: ["--others", "--exclude-standard"]
							}
						},
						result: $context.library.git.commands.lsFiles.result
					};

					var untracked = $context.library.git.program({ command: "git" })
						.repository(p.base)
						.command(lsFilesOthers)
						.argument()
						.run()
					;

					files = files.concat(untracked);

					var loader = $context.library.file.world.Location.directory.loader.synchronous({
						root: $context.library.file.world.Location.from.os(p.base)
					});
					return files.reduce(
						/**
						 *
						 * @param { slime.$api.fp.Maybe<number> } rv
						 * @param { string } path
						 */
						function(rv,path) {
							//	TODO	forward slash, or pathname separator?
							var resource = loader.get(path.split("/"));
							if (resource.present) {
								var modified = resource.value.modified();
								if (rv.present) {
									if (modified.present) {
										if (modified.value > rv.value) {
											rv = modified;
										}
									}
								} else {
									if (modified.present) {
										rv = modified;
									}
								}
							}
							return rv;
						},
						$api.fp.Maybe.from.nothing()
					);
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
