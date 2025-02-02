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
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		function getHtmlDocument() {
			var html = new jsh.document.Document({
				file: jsh.script.file.parent.parent.getFile("old/api.html")
			});
			return html;
		}

		/**
		 *
		 * @param {*} html
		 * @param {*} id
		 */
		function getElement(html,id) {
			var rv = html.identify(
				jsh.document.filter({ attribute: "id", value: id })
			);
			if (rv.children.filter(jsh.document.filter({ elements: "ul" })).length == 1) {
				rv = rv.identify({
					filter: jsh.document.filter({ elements: "ul"}),
					descendants: function(node) { return false; }
				});
			}
			return rv;
		}

		var namespaces = (function() {
			var namespaces = {};
			namespaces[jsh.document.namespace.XHTML] = "";
			return namespaces;
		})();

		var toHtml = function(element) {
			return element.children.map(function(child) {
				return child.serialize({
					namespaces: namespaces
				});
			}).join("");
		};

		/**
		 *
		 * @param { any } html
		 * @param { string } x - snippet id
		 */
		var elementToHtml = function(html, x) {
			return toHtml(getElement(html,"template." + x)).replace(/\/\//g, "");
		};

		/**
		 *
		 * @param { any } html
		 */
		var getHtmlSnippets = function(html) {
			var snippetAbbreviations = {
				value: "liv",
				object: "lio",
				function: "lif",
				constructor: "lic",
				type: "divt",
				supports: "spas",
				"test.initialize": "testi",
				"test.tests": "testt",
				"test.destroy": "testd",
				"test.fifty": "testf"
			};

			/**
			 * @type { slime.tools.snippets.ApiHtmlSnippet[] }
			 */
			var snippets = $api.fp.result(
				snippetAbbreviations,
				Object.entries,
				$api.fp.Array.map(
					function(p) {
						return {
							name: p[0],
							abbreviation: p[1],
							html: elementToHtml(html, p[0]).replace(/\$jsapi/g, "\\$jsapi")
						}
					}
				)
			);

			return snippets;
		};

		/**
		 *
		 * @param { slime.tools.snippets.ApiHtmlSnippet } snippet
		 * @returns { slime.tools.snippets.vscode.Snippet }
		 */
		function htmlSnippetToVscodeSnippet(snippet) {
			var lines = snippet.html.split("\n");

			if (lines[0]) throw new Error(JSON.stringify(lines));
			if (lines[lines.length-1].replace(/\t/g, "")) throw new Error(JSON.stringify(lines[lines.length-1]));

			lines = lines.slice(1,lines.length-1);

			var indentParser = /^(\s*).*$/;
			var indentMatch = indentParser.exec(lines[0])[1];
			for (var i=0; i<lines.length; i++) {
				var indent = lines[i].substring(0,indentMatch.length);
				if (indent == indentMatch) {
					lines[i] = lines[i].substring(indentMatch.length);
				} else {
					throw new Error("Does not start with " + JSON.stringify(indentMatch) + ": " + lines[i]);
				}
			}

			return {
				name: "api.html " + snippet.name,
				prefix: snippet.abbreviation,
				body: lines,
				description: "api.html " + snippet.name
			};
		}

		var snippetPattern = /^(.*)-(.*)\.zzz$/;

		/**
		 * Given a file extension, returns a function that searches the snippets subdirectory for files with the given extension to
		 * build a set of snippets for a language. All snippets have a trailing newline, as all files should; those whose snippet
		 * names end in `file` will be treated as whole files (and their trailing newlines will be retained); those whose snippet
		 * names do not will be treated as inline snippets and their trailing newline will be removed.
		 *
		 * @param { { extension: string } } p
		 * @returns { () => slime.tools.snippets.Language }
		 */
		var snippetFiles = function(p) {
			/**
			 *
			 * @param { string } code
			 * @returns { string }
			 */
			function removeLicense(code) {
				var lines = code.split("\n");
				var found;
				for (var i=0; i<lines.length; i++) {
					if (lines[i].indexOf("END LICENSE") != -1) {
						found = i;
					}
				}
				if (typeof(found) != "undefined") {
					return lines.slice(found+2).join("\n")
				} else {
					return code;
				}
			}

			/**
			 *
			 * @param { string } code
			 * @returns { string }
			 */
			function removeTrailingNewline(code) {
				var lines = code.split("\n");
				if (lines[lines.length-1] == "") {
					lines = lines.slice(0, lines.length-1);
				}
				return lines.join("\n");
			}

			return function() {
				var pattern = $api.fp.result(
					snippetPattern,
					$api.fp.RegExp.modify(function(pattern) {
						return pattern.replace(/zzz/g, p.extension)
					})
				);

				/**
				 *
				 * @param { slime.jrunscript.file.Node } node
				 * @returns { node is slime.jrunscript.file.File }
				 */
				var isFile = function(node) {
					return !node.directory;
				}

				var snippets = jsh.script.file.parent.getSubdirectory("snippets").list()
					.filter(isFile)
					.filter(function(node) {
						var match = pattern.exec(node.pathname.basename);
						return Boolean(match);
					}).map(function(node) {
						var match = pattern.exec(node.pathname.basename);
						var isFile = /file$/.test(match[1]);
						return {
							name: match[1],
							abbreviation: match[2],
							code: $api.fp.now.invoke(
								node.read(String),
								removeLicense,
								isFile ? $api.fp.identity : removeTrailingNewline
							)
						}
					})
				;

				return {
					json: snippets.map(function(snippet) {
						return {
							name: snippet.abbreviation,
							code: snippet.code
						}
					}),
					vscode: snippets.map(function(snippet) {
						return {
							name: "slime " + snippet.name,
							prefix: snippet.abbreviation,
							body: snippet.code.split("\n").map(function(line) {
								//	TODO	generalize; escaping everything except $0 is tricky, so we do some known values for now
								return line.replace(/\/\*\$0\*\//g, "$0")
									.replace(/\$api/g, "\\$api")
									.replace(/\$context/g, "\\$context")
									.replace(/\$export/g, "\\$export")
							}),
							description: "slime " + snippet.name
						}
					})
				}
			}
		}

		var languages = {
			/** @returns { slime.tools.snippets.Language } */
			html: function() {
				var html = getHtmlDocument();

				var snippets = getHtmlSnippets(html);

				//  TODO    strip leading shared whitespace

				return {
					json: snippets.map(function(snippet) {
						return { name: snippet.abbreviation, code: snippet.html }
					}),
					vscode: snippets.map(htmlSnippetToVscodeSnippet)
				}
			},
			javascript: snippetFiles({ extension: "js" }),
			typescript: snippetFiles({ extension: "ts" })
		}

		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.string({ longname: "language" }),
				jsh.script.cli.option.string({ longname: "format" }),
				function(p) {
					jsh.shell.console("language = " + p.options.language);
					var language = languages[p.options.language];
					var code = language({ format: p.options.format });

					var toObject = function(array) {
						return array.reduce(function(rv,element) {
							rv[element.name] = $api.fp.result(element, $api.fp.pipe(
								Object.entries,
								$api.fp.Array.filter(function(entry) { return entry[0] != "name"; }),
								Object.fromEntries
							));
							return rv;
						},{});
					}

					if (p.options.format == "vscode") {
						jsh.shell.echo(
							JSON.stringify(
								toObject(code.vscode),
								void(0),
								4
							)
						);
					} else {
						jsh.shell.echo(
							JSON.stringify(
								code.json.reduce(function(rv,snippet) {
									rv[snippet.name] = snippet.code;
									return rv;
								}, {}),
								void(0),
								4
							)
						)
					}
				}
			)
		);
	}
//@ts-ignore
)($api,jsh);
