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
		/**
		 *
		 * @param { slime.jrunscript.file.Directory } base
		 * @returns
		 */
		function getSourceFiles(base) {
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
		}

		/**
		 *
		 * @param { slime.project.metrics.SourceFile[] } array
		 * @returns
		 */
		var size = function(array) {
			return array.reduce(function(rv,entry) {
				return rv + $api.fp.world.now.ask($context.library.file.Location.file.size(entry.file.pathname.os.adapt()));
			},0);
		};

		/** @type { slime.$api.fp.Mapping<slime.runtime.document.Element,number> } */
		var getTestSize = function(element) {
			if (element.children.length > 1) throw new Error("Multiple children: " + JSON.stringify(element.children));
			var only = element.children[0];
			if ($context.library.document.Node.isString(only)) {
				return only.data.length;
			} else {
				throw new Error("Not string: " + JSON.stringify(only));
			}
		};

		/** @type { slime.project.metrics.Exports["SourceFile"]["isTypescript"] } */
		var isTypescript = function(entry) {
			return (/\.ts$/.test(entry.path));
		};

		/** @type { slime.project.metrics.Exports["SourceFile"]["isJavascript"] } */
		function isJavascript(entry) {
			return (/\.js$/.test(entry.path));
		}

		/** @type { slime.$api.fp.Mapping<slime.tools.code.Project,slime.project.metrics.JsapiAnalysis> } */
		var jsapiAnalysis = $api.fp.pipe(
			function(p) {
				//	TODO	simplify
				return {
					base: p.base,
					groups: $api.fp.Array.groupBy({
						/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.Location,string> } */
						group: function(entry) {
							return $context.library.code.jsapi.Location.group(entry);
						}
					})(p.files)
				}
			},
			function(p) {
				var getPath = $context.library.file.Location.directory.relativeTo(p.base);

				/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.Location,slime.project.metrics.SourceFile> } */
				var toSourceFile = function(location) {
					return {
						path: getPath(location),
						file: $context.library.file.Pathname(location.pathname).file
					}
				}

				return p.groups.map(
					/** @returns { slime.project.metrics.JsapiMigrationData } } */
					function(group) {
						var array = group.array.map(toSourceFile);
						return {
							name: group.group,
							files: group.array.length,
							bytes: size(array),
							list: function() {
								return array.map(function(entry) {
									var tests = (function() {
										var parsed = $context.library.code.jsapi.Location.parse(entry.file.pathname.os.adapt());
										if (parsed.present) {
											var tests = $context.library.code.jsapi.Element.getTestingElements(parsed.value).reduce(function(rv,element) {
												return rv + getTestSize(element);
											}, 0);
											return $api.fp.Maybe.from.some(tests);
										} else {
											return $api.fp.Maybe.from.nothing();
										}
									})();
									return {
										path: entry.path,
										bytes: entry.file.length,
										tests: tests
									}
								}).sort(function(a,b) {
									return b.bytes - a.bytes;
								});
							}
						}
					}
				)
			},
			function(p) {
				var byName = function(name) {
					return p.find(function(group) {
						return group.name == name;
					});
				};

				return {
					jsapi: byName("jsapi"),
					fifty: byName("fifty")
				}
			}
		);

		$export({
			getSourceFiles: getSourceFiles,
			SourceFile: {
				isJsapi: function(file) {
					return $context.library.code.jsapi.Location.is(file.file.pathname.os.adapt());
				},
				isGenerated: function(file) {
					if (file.path == "rhino/tools/docker/tools/docker-api.d.ts") return true;
					if (file.path == "rhino/tools/github/tools/github-rest.d.ts") return true;
					return false;
				},
				isJavascript: isJavascript,
				isTypescript: isTypescript,
				javascript: {
					hasTypeChecking: function(entry) {
						if (isJavascript(entry)) {
							var code = entry.file.read(String);
							return $api.fp.Maybe.from.some(code.indexOf("ts-check") != -1);
						}
						return $api.fp.Maybe.from.nothing();
					}
				}
			},
			jsapi: {
				analysis: $api.fp.pipe(
					function(directory) { return directory.pathname.os.adapt(); },
					function(location) {
						return $context.library.code.Project.from.directory({
							root: location,
							descend: function(directory) {
								var basename = $context.library.file.Location.basename(directory);
								if (basename == ".git") return false;
								if (basename == "bin") return false;
								if (basename == "local") return false;
								return true;
							},
							isSource: function(file) {
								return $api.fp.Maybe.from.some(true);
							}
						});
					},
					jsapiAnalysis
				)
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
