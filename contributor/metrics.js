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
	 * @param { slime.project.metrics.Context } $context
	 * @param { slime.loader.Export<slime.project.metrics.Exports> } $export
	 */
	function($api,$context,$export) {
		$export({
			getSourceFiles: function getSourceFiles(base) {
				/** @type { slime.js.Cast<slime.jrunscript.file.File> } */
				var castToFile = $api.fp.cast;
				return base.list({
					type: $context.library.file.list.ENTRY,
					filter: function(item) {
						if (item.pathname.basename == ".git") return false;
						if (item.pathname.basename == "local") return false;
						//	TODO	currently no subdirectories called "bin," if there were, this might be wrong
						if (item.pathname.basename == "bin") return false;
						if (item.directory) return false;
						return true;
					},
					descendants: function(dir) {
						if (dir.pathname.basename == ".git") return false;
						if (dir.pathname.basename == "local") return false;
						if (dir.pathname.basename == "bin") return false;
						return true;
					}
				}).map(function(entry) {
					return {
						path: entry.path,
						file: castToFile(entry.node)
					}
				});
			},
			SourceFile: (
				function() {
					/** @type { slime.project.metrics.Exports["SourceFile"]["isJavascript"] } */
					function isJavascript(entry) {
						return (/\.js$/.test(entry.path));
					}

					return {
						isJsapi: function(file) {
							return $context.library.code.jsapi.Location.is(file.file.pathname.os.adapt());
						},
						isGenerated: function(file) {
							if (file.path == "rhino/tools/docker/tools/docker-api.d.ts") return true;
							if (file.path == "rhino/tools/github/tools/github-rest.d.ts") return true;
							return false;
						},
						isJavascript: isJavascript,
						isTypescript: function(entry) {
							return (/\.ts$/.test(entry.path));
						},
						javascript: {
							hasTypeChecking: function(entry) {
								if (isJavascript(entry)) {
									var code = entry.file.read(String);
									return $api.fp.Maybe.from.some(code.indexOf("ts-check") != -1);
								}
								return $api.fp.Maybe.from.nothing();
							}
						}
					};
				}
			)()
		});
	}
//@ts-ignore
)($api,$context,$export);
