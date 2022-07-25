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
	 * @param { slime.project.jsapi.Context } $context
	 * @param { slime.loader.Export<slime.project.jsapi.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { string } string
		 */
		function prefix(string) {
			var trimmed = string.trim();
			var leadingWhitespacePattern = /^(\s+)/;
			if (trimmed.substring(0,3) == "/**") {
				return string.substring(0,string.indexOf("/**"));
			}
			if (trimmed.substring(0,1) == "*") {
				var at = string.indexOf("*");
				if (string.substring(at-1,at) != " ") {
					return null;
				}
				return string.substring(0,at-1);
			}
			var leadingWhitespaceMatch = leadingWhitespacePattern.exec(string);
			if (leadingWhitespaceMatch) {
				return leadingWhitespaceMatch[1];
			}
			return null;
		}

		/**
		 *
		 * @param { string } line
		 */
		function getDisplayLength(line,tabSize) {
			//	TODO	this would not work with mixed spaces/tabs
			if (line.length == 0) return 0;
			var tabs = line.split("\t").length - 1;
			return (line.length - tabs) * 1 + tabs * tabSize;
		}

		/**
		 *
		 * @param { string } line
		 * @returns { slime.project.jsapi.internal.InputLine }
		 */
		function parseLine(line) {
			var start = prefix(line);
			var rest = (start) ? line.substring(start.length) : line;
			/** @type { slime.project.jsapi.internal.InputLine["section"] } */
			var comment = null;
			var content = rest;
			if (rest.substring(0,3) == "/**") {
				comment = "start";
				content = rest.substring(3).trim();
			} else if (rest.substring(0,3) == " */") {
				comment = "end";
				content = "";
			} else if (rest.substring(0,2) == " *") {
				comment = "middle";
				content = rest.substring(2).trim();
			}
			return {
				prefix: start,
				section: comment,
				content: content
			};
		}

		/**
		 *
		 * @param { string } tagName
		 * @param { string } delimiter
		 */
		function startEndTagReplace(tagName, delimiter) {
			var startPattern = new RegExp("\<" + tagName + "\>", "g");
			var endPattern = new RegExp("\<\/" + tagName + "\>", "g");
			return function(input) {
				return input.replace(startPattern, delimiter).replace(endPattern, delimiter);
			}
		}

		$export({
			test: {
				prefix: prefix
			},
			comment: function(format) {
				//	TODO	make format an argument to below rather than a scope variable
				/**
				 *
				 * @param { string } prefix The indent to use
				 * @param { boolean } hasStart Whether the start of this content is the start of a comment
				 * @param { boolean } hasEnd Whether the start of this content is the end of a comment
				 */
				function formatByLineLength(prefix, hasStart, hasEnd) {
					/**
					 * @param { string[] } content
					 * @returns { string[] }
					 */
					return function(content) {
						/** @type { string[] } */
						var result = [];
						var index = 0;
						while(index < content.length) {
							var currentLine = function() { return result[result.length-1] };
							var currentWord = function() { return content[index]; }
							if (result.length == 0) {
								if (hasStart) {
									result.push(prefix + "/**");
								}
								result.push(prefix + " * ");
							}
							if (getDisplayLength(currentLine() + " " + currentWord(), format.tabSize) <= format.lineLength) {
								var hasWord = currentLine().length > (prefix + " * ").length;
								result[result.length-1] += (hasWord ? " " : "") + currentWord();
							} else {
								result.push(prefix + " * " + currentWord());
							}
							index++;
						}
						if (hasEnd /*parsed.end*/) result.push(prefix + " */");
						return result;
					}
				}

				return $api.Function.pipe(
					startEndTagReplace("code", "`"),
					startEndTagReplace("i", "*"),
					startEndTagReplace("em", "*"),
					$api.Function.string.split("\n"),
					$api.Function.Array.map(parseLine),
					function(lines) {
						/** @type { { prefix: string, content: string[], end: boolean } } */
						var parsed = {
							prefix: lines[0].prefix,
							content: lines.map($api.Function.property("content")).reduce(
								/**
								 * @param { string[] } rv
								 * @param { string } content
								 */
								function(rv,content) {
									return rv.concat(
										(content) ? content.split(" ") : []
									);
								},
								/** @type { string[] } */
								[]
							),
							end: Boolean(lines[lines.length-1].section == "end")
						};

						var result = formatByLineLength(
							parsed.prefix,
							lines[0].section == "start",
							parsed.end
						)(parsed.content);

						//	TODO	figure out semantics and replace expression with named boolean variable or function
						if (!lines[lines.length-1].section && !lines[lines.length-1].prefix && !lines[lines.length-1].content)
							result.push("");

						//input = text(input);

						return result.join("\n");
					}
				)
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
