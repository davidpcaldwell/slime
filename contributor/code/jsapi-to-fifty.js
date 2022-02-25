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

		function parseLine(line) {
			var start = prefix(line);
			var rest = (start) ? line.substring(start.length) : line;
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
				comment: comment,
				content: content
			};
		}

		$export({
			test: {
				prefix: prefix
			},
			comment: function(format) {
				return function(input) {
					input = input.replace(/\<code\>/g, "`").replace(/\<\/code\>/g, "`");
					input = input.replace(/\<i\>/g, "*").replace(/\<\/i\>/g, "*");
					var lines = input.split("\n").map(parseLine);
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
						end: Boolean(lines[lines.length-1].comment == "end")
					};
					var result = [];
					var index = 0;
					while(index < parsed.content.length) {
						var currentLine = function() { return result[result.length-1] };
						var currentWord = function() { return parsed.content[index]; }
						if (result.length == 0) {
							if (lines[0].comment == "start") {
								result.push(parsed.prefix + "/**");
							}
							result.push(parsed.prefix + " * ");
						}
						if (getDisplayLength(currentLine() + " " + currentWord(), format.tabSize) <= format.lineLength) {
							var hasWord = currentLine().length > (parsed.prefix + " * ").length;
							result[result.length-1] += (hasWord ? " " : "") + currentWord();
						} else {
							result.push(parsed.prefix + " * " + currentWord());
						}
						index++;
					}
					if (parsed.end) result.push(parsed.prefix + " */");
					//input = text(input);
					return result.join("\n");
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
