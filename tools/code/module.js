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
	 * @param { slime.tools.code.Context } $context
	 * @param { slime.loader.Export<slime.tools.code.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
		var castToFile = $api.Function.cast;

		/**
		 *
		 * @param { slime.$api.fp.Predicate<slime.jrunscript.file.File> } isExcludedFile
		 * @returns { slime.$api.fp.Predicate<slime.jrunscript.file.Node> }
		 */
		function isAuthoredTextFile(isExcludedFile) {
			return function(node) {
				if (node.directory) return false;
				if (isExcludedFile(castToFile(node))) return false;
				return true;
			}
		}

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
		}

		var filename = {
			isText: function(basename) {
				//	Determines whether a file is text (true) or binary (false) by its name.
				//	https://fileinfo.com/ is a reasonable resource for checking whether file extensions are well-established.
				if (basename == ".DS_Store") return false;
				if (/\.txt$/.test(basename)) return true;

				if (/\.js$/.test(basename)) return true;
				if (/\.pac$/.test(basename)) return true;
				if (/\.ts$/.test(basename)) return true;
				if (/\.json$/.test(basename)) return true;

				if (/\.kts$/.test(basename)) return true;
				if (/\.gradle$/.test(basename)) return true;

				if (/\.html$/.test(basename)) return true;
				if (/\.java$/.test(basename)) return true;
				if (/\.css$/.test(basename)) return true;
				if (/\.c$/.test(basename)) return true;
				if (/\.cpp$/.test(basename)) return true;
				if (/\.xml$/.test(basename)) return true;
				if (/\.properties$/.test(basename)) return true;
				if (/\.coffee$/.test(basename)) return true;
				if (/\.md/.test(basename)) return true;
				if (/\.wav$/.test(basename)) return false;
				if (/\.xls$/.test(basename)) return false;
				if (/\.xls$/.test(basename)) return false;
				if (/\.xlsx$/.test(basename)) return false;
				if (/\.numbers$/.test(basename)) return false;
				if (/\.hgrc$/.test(basename)) return true;
				if (/\.gitignore$/.test(basename)) return true;
				if (/\.dockerignore$/.test(basename)) return true;
				if (/Dockerfile$/.test(basename)) return true;
				if (/\.bashrc$/.test(basename)) return true;
			},
			isVcsGenerated: function(name) {
				if (name == ".hgtags") return true;
				if (name == ".git") return true;
			},
			isIdeGenerated: function(name) {
				if (/\.iml$/.test(name)) return true;
			}
		};

		/**
		 *
		 * @type { slime.tools.code.Exports["directory"] }
		 */
		var directory = {
			isLocal: function(directory) { return directory.pathname.basename == "local"; },
			isVcs: function(directory) {
				var basename = directory.pathname.basename;
				return basename == ".git" || basename == ".hg" || basename == ".svn";
			},
			isBuildTool: function(directory) {
				var basename = directory.pathname.basename;
				return basename == ".gradle" || basename == "gradle" || basename == "build" || basename == "target";
			}
		}

		var defaults = {
			exclude: {
				file: $api.Function.pipe(
					function(file) { return file.pathname.basename; },
					$api.Function.Predicate.or(
						filename.isVcsGenerated,
						filename.isIdeGenerated
					)
				),
				directory: $api.Function.Predicate.or(
					directory.isLocal,
					directory.isVcs,
					directory.isBuildTool
				)
			}
		}

		/**
		 *
		 * @type { slime.tools.code.Exports["getSourceFiles"] }
		 */
		function getSourceFiles(p) {
			if (!p.base) throw new Error("Required: base, specifying directory.");
			return $api.Function.impure.ask(function(on) {
				return p.base.list({
					filter: isAuthoredTextFile( (p.exclude && p.exclude.file) ? p.exclude.file : defaults.exclude.file ),
					descendants: $api.Function.Predicate.not( (p.exclude && p.exclude.directory) ? p.exclude.directory : defaults.exclude.directory ),
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

		var trailingWhitespaceParser = /(.*?)\s+$/;

		/**
		 *
		 * @param { string } line
		 */
		function hasTrailingWhitespace(line) {
			return trailingWhitespaceParser.test(line);
		}

		/**
		 *
		 * @param { string } line
		 * @returns
		 */
		function withoutTrailingWhitespace(line) {
			var match = trailingWhitespaceParser.exec(line);
			return (match) ? match[1] : line;
		}

		/**
		 *
		 * @type { slime.tools.code.Exports["scanForTrailingWhitespace"] }
		 */
		function findTrailingWhitespaceIn(code) {
			var ending = (code.indexOf("\r\n") != -1) ? "\r\n" : "\n";
			var scan = code.split(ending).reduce(function(rv,line,index) {
				if (hasTrailingWhitespace(line)) {
					rv.instances.push({
						line: index+1,
						content: line
					});
					rv.without.push(withoutTrailingWhitespace(line));
				} else {
					rv.without.push(line);
				}
				return rv;
			}, {
				/** @type { { line: number, content: string }[] } */
				instances: [],
				/** @type { string[] } */
				without: []
			});
			return {
				without: scan.without.join(ending),
				instances: scan.instances
			}
		}

		/**
		 *
		 * @type { slime.tools.code.Exports["handleFileTrailingWhitespace"] }
		 */
		function handleFileTrailingWhitespace(configuration) {
			return function(entry) {
				if (!configuration) configuration = {
					nowrite: false
				};
				return $api.Function.impure.tell(function(events) {
					var code = entry.file.read(String);
					var scan = findTrailingWhitespaceIn(code);
					scan.instances.forEach(function(instance) {
						events.fire("foundAt", {
							file: entry,
							line: {
								number: instance.line,
								content: instance.content
							}
						});
					});
					if (scan.instances.length) {
						events.fire("foundIn", entry);
						if (!configuration.nowrite) {
							entry.file.pathname.write(scan.without, { append: false });
						}
					} else {
						events.fire("notFoundIn", entry);
					}
				});
			}
		}

		/**
		 *
		 * @type { slime.tools.code.Exports["handleTrailingWhitespace"] }
		 */
		var trailingWhitespace = function(p) {
			return $api.Function.impure.tell(function(events) {
				//	TODO	is there a simpler way to forward all those events below?
				getSourceFiles({
					base: p.base,
					isText: (p.isText) ? p.isText : function(file) {
						return filename.isText(file.file.pathname.basename);
					},
					exclude: p.exclude
				})({
					unknownFileType: function(e) {
						events.fire("unknownFileType", e.detail);
					}
				}).forEach(function(entry) {
					handleFileTrailingWhitespace(p)(entry)({
						foundAt: function(e) {
							events.fire("foundAt", e.detail);
						},
						foundIn: function(e) {
							events.fire("foundIn", e.detail);
						},
						notFoundIn: function(e) {
							events.fire("notFoundIn", e.detail);
						}
					});
				});
			});
		}

		$export({
			filename: filename,
			directory: directory,
			defaults: defaults,
			getSourceFiles: getSourceFiles,
			handleFileTrailingWhitespace: handleFileTrailingWhitespace,
			scanForTrailingWhitespace: findTrailingWhitespaceIn,
			handleTrailingWhitespace: trailingWhitespace
		})
	}
//@ts-ignore
)($api,$context,$export);
