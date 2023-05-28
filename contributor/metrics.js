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
				return rv + entry.file.length;
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
		}

		/** @type { slime.$api.fp.Predicate<slime.runtime.document.Element> } */
		var isJsapiTestingElement = $api.fp.Predicate.and(
			$context.library.document.Element.isName("script"),
			$api.fp.pipe(
				$context.library.document.Element.getAttribute("type"),
				function(value) {
					return value.present && /application\/x.jsapi\#/.test(value.value)
				}
			)
		)

		var Element = {
			isJsapiTestingElement: isJsapiTestingElement,
			/** @type { (p: slime.runtime.document.Document) => slime.runtime.document.Element[]  } */
			getJsapiTestingElements: $api.fp.pipe(
				$context.library.document.Parent.nodes,
				$api.fp.Stream.filter($context.library.document.Node.isElement),
				$api.fp.Stream.filter(isJsapiTestingElement),
				$api.fp.Stream.collect
			)
		};

		/** @type { slime.$api.fp.Mapping<slime.jrunscript.file.File,slime.runtime.document.Document> } */
		var parseJsapiHtml = function(file) {
			var markup = file.read(String);

			var parse = $context.library.code.document.parse(markup);

			if (!parse.present) throw new Error("Bug in parser: incorrect result parsing " + file.pathname);

			return parse.value;
		}

		/** @type { (entry: slime.project.metrics.SourceFile) => boolean } */
		var isJsapi = function(entry) {
			var file = entry.file;
			if (file.pathname.basename == "api.html" || /\.api\.html$/.test(file.pathname.basename)) {
				return true;
			}
			if (/\.html$/.test(file.pathname.basename)) {
				var parsed = parseJsapiHtml(file);
				var elements = Element.getJsapiTestingElements(parsed);
				return Boolean(elements.length);
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

				var object = $api.fp.now.invoke(
					results,
					$api.fp.Array.map(
						/** @returns { [string, slime.project.metrics.SourceFile[]] } */
						function(group) {
							return [ group.group, group.array ];
						}
					),
					function(p) {
						return Object.fromEntries(p);
					}
				);

				return {
					fifty: {
						name: "fifty",
						files: object.fifty.length,
						bytes: size(object.fifty)
					},
					jsapi: {
						name: "jsapi",
						files: object.jsapi.length,
						bytes: size(object.jsapi),
						list: (function() {
							return object.jsapi.map(function(entry) {
								var tests = (function() {
									try {
										var parsed = parseJsapiHtml(entry.file);
										var tests = 0;
										Element.getJsapiElements(parsed).reduce(function(rv,element) {
											tests += getTestSize(element);
										}, 0);
										return $api.fp.Maybe.from.some(tests);
									} catch (e) {
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
						})()
					}
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
