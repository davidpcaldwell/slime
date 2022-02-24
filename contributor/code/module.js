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
			 * @this { {} }
			 * @returns { slime.project.code.Exports["files"] }
			 */
			function() {
				/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
				var castToFile = $api.Function.cast;

				/**
				 *
				 * @param { { path: string, node: slime.jrunscript.file.Node } } p
				 * @returns { slime.tools.code.File }
				 */
				function toSourceFile(p) {
					return {
						path: p.path,
						file: castToFile(p.node)
					}
				};

				/**
				 *
				 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.File> } isExcludedFile
				 * @returns { slime.$api.fp.Predicate<slime.jrunscript.file.Node> }
				 */
				var isAuthoredTextFile = function(isExcludedFile) {
					return function(node) {
						if (false) $context.console("Checking: " + node);
						if (node.directory) return false;
						if (isExcludedFile(castToFile(node))) return false;
						return true;
					}
				};

				var isSourceDirectory = function(directory) {
					return directory.pathname.basename != "local"
						&& directory.pathname.basename != ".hg"
						&& directory.pathname.basename != ".git"
						&& directory.pathname.basename != ".svn"
						&& directory.pathname.basename != "bin"
						&& directory.pathname.basename != "build"
						&& directory.pathname.basename != "target"
						&& directory.pathname.basename != ".settings"
						&& directory.pathname.basename != ".gradle"
				};

				/** @type { slime.project.code.Exports["files"]["isText"] } */
				var isText = function(node) {
					var basename = node.pathname.basename;
					var rv = $context.library.code.filename.isText(basename);
					if (typeof(rv) != "undefined") return rv;

					//	Project-specific extensions
					//	TODO	should be able to rename this one and get rid of it
					if (/\.jsh$/.test(basename)) return true;

					//	Seems to be a SLIME-ism, probably should use shebang to determine this
					if (/\.bash$/.test(basename)) return true;

					//	TODO	if license.js has a license for the file, should always return true; we are repeating information

					//	This is a specific project file of test data for a ServiceLoader-related test
					if (/META-INF\/services\/java.lang.Runnable$/.test(node.pathname.toString())) return false;
				}

				/** @type { { extension: slime.project.code.isText }} */
				var isTexts = (
					function() {
						var extension = function(entry) {
							return isText(entry.node);
						};

						// var options = function(options) {
						// 	var extensions = {};
						// 	var specified = {};
						// 	options.text.forEach(function(path) {
						// 		if (path.substring(0,1) == ".") {
						// 			extensions[path.substring(1)] = true;
						// 		} else {
						// 			specified[path] = true;
						// 		}
						// 	});
						// 	options.binary.forEach(function(path) {
						// 		if (path.substring(0,1) == ".") {
						// 			extensions[path] = false;
						// 		} else {
						// 			specified[path] = false;
						// 		}
						// 	});
						// 	return function(entry) {
						// 		if (typeof(specified[entry.path]) != "undefined") return specified[entry.path];
						// 		var extension = (function() {
						// 			var tokens = entry.node.pathname.basename.split(".");
						// 			if (tokens.length > 1) {
						// 				return tokens[tokens.length-1];
						// 			} else {
						// 				return null;
						// 			}
						// 		})();
						// 		if (extension && typeof(extensions[extension]) != "undefined") {
						// 			return extensions[extension];
						// 		}
						// 	}
						// }

						return {
							extension: extension//,
							// options: options
						}
					}
				)();

				/**
				 *
				 * @type { slime.project.code.GetSourceFiles }
				 */
				function getSourceFiles(p) {
					if (!p.base) throw new Error("Required: base, specifying directory.");
					return $api.Function.impure.ask(function(on) {
						return p.base.list({
							filter: isAuthoredTextFile(p.exclude.file),
							descendants: $api.Function.Predicate.not(p.exclude.directory),
							type: $context.library.file.list.ENTRY
						}).map(toSourceFile).filter(
							$api.Function.series(
								p.isText,
								function(file) {
									on.fire("unknownFileType", file);
									return void(0);
								}
							)
						)
					});
				}

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

				/** @type { slime.project.code.Exports["files"]["trailingWhitespace"] } */
				var trailingWhitespace = function(p) {
					/** @type { slime.$api.fp.Predicate<slime.jrunscript.file.File> } */
					var isGeneratedTextFile = $api.Function.pipe(
						function(file) { return file.pathname.basename; },
						$api.Function.Predicate.or(
							$context.library.code.filename.isVcsGenerated,
							$context.library.code.filename.isIdeGenerated
						)
					);

					getSourceFiles({
						base: p.base,
						isText: (p.isText) ? p.isText : isTexts.extension,
						exclude: {
							file: isGeneratedTextFile,
							directory: $api.Function.Predicate.not(isSourceDirectory)
						}
					})({
						unknownFileType: function(e) {
							if (p.on && p.on.unknownFileType) p.on.unknownFileType(e.detail);
						}
					}).forEach(function(entry) {
						var code = entry.file.read(String);
						var ending = "\n";
						if (code.indexOf("\r\n") != -1) {
							ending = "\r\n";
						}
						var lines = [];
						var changed = false;
						entry.file.read(String).split(ending).forEach(function(line) {
							var rv = line;
							var match;
							if (match = /(.*?)\s+$/.exec(line)) {
								p.on.change({
									path: entry.path,
									line: {
										number: lines.length+1,
										content: line
									}
								});
								rv = match[1];
							}
							lines.push(rv);
							if (rv != line) {
								changed = true;
							}
						});
						if (changed) {
							p.on.changed(entry);
							if (!p.nowrite) {
								entry.file.pathname.write(lines.join(ending), { append: false });
							}
						} else {
							p.on.unchanged(entry);
						}
					});
				}

				return {
					isText: isText,
					trailingWhitespace: trailingWhitespace
				}
			}
		)();

		$export({
			files: files
		});
	}
//@ts-ignore
)($api,$context,$export);
