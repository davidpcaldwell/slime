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
	 * @param { slime.jsh.script.cli.main } main
	 */
	function($api,jsh,main) {
		var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent });
		var code = {
			/** @type { slime.project.metrics.Script } */
			metrics: loader.script("metrics.js")
		};
		var library = {
			metrics: code.metrics({
				library: {
					document: jsh.document,
					file: jsh.file,
					code: jsh.tools.code,
					project: jsh.project.code
				}
			})
		};

		/** @param { slime.project.metrics.SourceFile } file */
		var isUnchecked = function(file) {
			if (library.metrics.SourceFile.isTypescript(file)) return false;
			if (library.metrics.SourceFile.isJavascript(file)) return !library.metrics.SourceFile.javascript.hasTypeChecking(file)["value"];
			return true;
		}

		/** @param { slime.jrunscript.file.Directory } from */
		var search = function(from,pattern) {
			var regexp = new RegExp(pattern);
			/** @param { slime.$api.Events<{ match: { path: string, line: number, text: string } }> } events */
			return function(events) {
				var files = library.metrics.getSourceFiles(from);
				files.forEach(function(file) {
					if (isUnchecked(file)) {
						var lines = file.file.read(String).split("\n");
						lines.forEach(function(line,index) {
							if (regexp.test(line)) {
								events.fire("match", { path: file.path, line: index+1, text: line });
							}
						});
					}
				});
			}
		};

		main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "pattern" }),
				function(p) {
					var directory = jsh.script.file.parent.parent.parent;
					jsh.shell.console("Searching for unchecked usages matching [" + p.options.pattern + "] in " + directory + " ...");
					$api.events.invoke(
						search(directory, p.options.pattern),
						{
							match: function(e) {
								jsh.shell.console(e.detail.path + ":" + e.detail.line + ": " + e.detail.text);
							}
						}
					);
				}
			)
		)
	}
//@ts-ignore
)($api,jsh,main);
