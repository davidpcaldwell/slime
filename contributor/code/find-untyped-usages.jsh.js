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
		/** @param { slime.tools.code.File } file */
		var isUnchecked = function(file) {
			if (jsh.tools.code.File.isTypescript(file)) return false;
			if (jsh.tools.code.File.isJavascript(file)) return !jsh.tools.code.File.javascript.hasTypeChecking(file)["value"];
			return true;
		}

		/**
		 * @typedef { object } Match
		 * @property { string } path
		 * @property { number } line
		 * @property { string } text
		 */

		/** @type { slime.$api.fp.world.Sensor<{ from: slime.jrunscript.file.Directory, pattern: string },{ match: Match }, Match[]> } */
		var search = function(p) {
			var regexp = new RegExp(p.pattern);
			/** @param { slime.$api.event.Producer<{ match: { path: string, line: number, text: string } }> } events */
			return function(events) {
				/** @type { Match[] } */
				var rv = [];
				var project = jsh.tools.code.Project.from.directory({
					root: p.from.pathname.os.adapt(),
					excludes: {
						descend: function(directory) {
							//	TODO	SLIME-specfic use of bin
							var basename = jsh.file.Location.basename(directory);
							if (basename == ".git") return false;
							if (basename == "local") return false;
							if (basename == "bin") return false;
							return true;
						},
						isSource: function(file) {
							//	TODO	SLIME-specfic use of jsh.project.code
							return $api.fp.Maybe.from.some(jsh.project.code.files.isText({
								path: void(0),
								file: file
							}));
						}
					}
				});
				var files = jsh.tools.code.Project.files(project);
				files.forEach(function(file) {
					if (isUnchecked(file)) {
						var lines = $api.fp.now.invoke(
							file.file,
							jsh.file.Location.file.read.string.simple,
							$api.fp.string.split("\n")
						);
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
