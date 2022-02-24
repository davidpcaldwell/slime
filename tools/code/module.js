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

		/**
		 *
		 * @type { slime.tools.code.Exports["getSourceFiles"] }
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

		/**
		 *
		 * @type { slime.tools.code.Exports["findTrailingWhitespace"] }
		 */
		function findTrailingWhitespace(configuration) {
			return function(entry) {
				if (!configuration) configuration = {
					nowrite: false
				};
				return $api.Function.impure.tell(function(events) {
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
							events.fire("foundAt", {
								file: entry,
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
						events.fire("foundIn", entry);
						if (!configuration.nowrite) {
							entry.file.pathname.write(lines.join(ending), { append: false });
						}
					} else {
						events.fire("notFoundIn", entry);
					}
				});
			}
		}

		$export({
			filename: {
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
			},
			getSourceFiles: getSourceFiles,
			findTrailingWhitespace: findTrailingWhitespace
		})
	}
//@ts-ignore
)($api,$context,$export);
