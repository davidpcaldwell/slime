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
			});
		}

		var size = function(group) {
			return group.array.reduce(function(rv,entry) {
				return rv + entry.node.length;
			},0);
		};

		$export({
			getSourceFiles: getSourceFiles,
			jsapi: function(base) {
				var src = getSourceFiles(base);
				var grouper = $api.Function.Array.groupBy({
					group: function(entry) {
						var node = entry.node;
						if (node.pathname.basename == "api.html" || /\.api\.html$/.test(node.pathname.basename)) {
							return "jsapi"
						}
						if (/\.html$/.test(node.pathname.basename)) {
							var markup = node.read(String);

							var parsed = $context.library.document.Document.codec.string.decode(
								markup
							);

							var serialized = $context.library.document.Document.codec.string.encode(parsed);

							if (markup != serialized) {
								throw new Error("Could not parse: " + node.pathname);
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
								return "jsapi";
							}
						}
						if (/\.fifty\.ts$/.test(node.pathname.basename)) {
							return "fifty"
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
									bytes: entry.node.length
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
