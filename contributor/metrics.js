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
		 * @param { { array: slime.project.metrics.SourceFile[] }} group
		 * @returns
		 */
		var size = function(group) {
			return group.array.reduce(function(rv,entry) {
				return rv + entry.file.length;
			},0);
		};

		/** @type { (entry: slime.project.metrics.SourceFile) => boolean } */
		var isJsapi = function(entry) {
			var file = entry.file;
			if (file.pathname.basename == "api.html" || /\.api\.html$/.test(file.pathname.basename)) {
				return true;
			}
			if (/\.html$/.test(file.pathname.basename)) {
				var markup = file.read(String);

				var parsed = $context.library.document.Document.codec.string.decode(
					markup
				);

				var serialized = $context.library.document.Document.codec.string.encode(parsed);

				if (markup != serialized) {
					throw new Error("Could not parse: " + file.pathname);
				}

				var getAttribute = function(name) {
					/**
					 *
					 * @param { slime.runtime.document.Element } element
					 */
					return function(element) {
						var found = element.attributes.find(function(attribute) {
							return attribute.name == name;
						});
						return (found) ? found.value : null;
					}
				}
				/**
				 *
				 * @param { slime.runtime.document.Element } element
				 */
				var isJsapiTest = function(element) {
					return element.name == "script" && getAttribute("type")(element) == "application/x.jsapi#tests";
				}

				var isJsapi = false;

				var process = function(node) {
					if ($context.library.document.Node.isElement(node)) {
						if (isJsapiTest(node)) isJsapi = true;
					}
					if ($context.library.document.Node.isParent(node)) {
						node.children.forEach(process);
					}
				}

				process(parsed);

				if (isJsapi) {
					return true;
				}
				return false;
			}
		}

		/** @type { slime.project.metrics.Exports["SourceFile"]["isTypescript"] } */
		var isTypescript = function(entry) {
			return (/\.ts$/.test(entry.path));
		};

		/** @type { slime.project.metrics.Exports["SourceFile"]["isJavascript"] } */
		function isJavascript(entry) {
			return (/\.js$/.test(entry.path));
		}

		$export({
			getSourceFiles: getSourceFiles,
			SourceFile: {
				isJsapi: isJsapi,
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
			jsapi: function(base) {
				var src = getSourceFiles(base);
				var grouper = $api.fp.Array.groupBy({
					/** @type { (p: slime.project.metrics.SourceFile) => string } */
					group: function(entry) {
						if (isJsapi(entry)) return "jsapi";
						if (/\.fifty\.ts$/.test(entry.file.pathname.basename)) {
							return "fifty";
						}
						return "unknown";
					}
				});
				var results = grouper(src);

				var fifty = results.find(function(group) {
					return group.group == "fifty";
				});
				var jsapi = results.find(function(group) {
					return group.group == "jsapi";
				});
				return {
					fifty: {
						name: "fifty",
						files: fifty.array.length,
						bytes: size(fifty)
					},
					jsapi: {
						name: "jsapi",
						files: jsapi.array.length,
						bytes: size(jsapi),
						list: (function() {
							return jsapi.array.map(function(entry) {
								return {
									path: entry.path,
									bytes: entry.file.length
								}
							}).sort(function(a,b) {
								return b.bytes - a.bytes;
							});
						})()
					}
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
