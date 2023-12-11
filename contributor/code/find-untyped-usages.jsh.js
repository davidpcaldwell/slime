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
		var loader = new jsh.file.Loader({ directory: jsh.script.file.parent.parent });
		var code = {
			/** @type { slime.project.metrics.Script } */
			metrics: loader.script("metrics.js")
		};
		var library = {
			metrics: code.metrics({
				library: {
					file: jsh.file,
					code: jsh.tools.code
				}
			})
		};

		/** @param { slime.project.metrics.SourceFile } file */
		var isUnchecked = function(file) {
			if (library.metrics.SourceFile.isTypescript(file)) return false;
			if (library.metrics.SourceFile.isJavascript(file)) return !library.metrics.SourceFile.javascript.hasTypeChecking(file)["value"];
			return true;
		}

		/**
		 * @typedef { object } Match
		 * @property { string } path
		 * @property { number } line
		 * @property { string } text
		 */

		/** @type { slime.$api.fp.world.Instrument<{ from: slime.jrunscript.file.Directory, pattern: string },{ match: Match }, Match[]> } */
		var search = function(p) {
			var regexp = new RegExp(p.pattern);
			/** @param { slime.$api.Events<{ match: { path: string, line: number, text: string } }> } events */
			return function(events) {
				/** @type { Match[] } */
				var rv = [];
				var files = library.metrics.getSourceFiles(p.from);
				files.forEach(function(file) {
					if (isUnchecked(file)) {
						var lines = file.file.read(String).split("\n");
						lines.forEach(function(line,index) {
							if (regexp.test(line)) {
								/** @type { Match } */
								var match = { path: file.path, line: index+1, text: line };
								events.fire("match", match);
								rv.push(match);
							}
						});
					}
				});
				return rv;
			}
		};

		//	TODO	adapt this for usage on arbitrary codebases
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "pattern" }),
				function(p) {
					var directory = jsh.script.file.parent.parent.parent;
					jsh.shell.console("Searching for unchecked usages matching [" + p.options.pattern + "] in " + directory + " ...");
					$api.fp.world.now.question(
						search,
						{ from: directory, pattern: p.options.pattern },
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
)($api,jsh);
