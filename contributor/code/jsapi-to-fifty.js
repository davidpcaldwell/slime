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

		var $$api = {
			Function: {
				/** @type { slime.project.jsapi.fp.Switch } */
				switch: function() {
					var cases = Array.prototype.slice.call(arguments);
					return function(p) {
						for (var i=0; i<cases.length; i++) {
							var r = cases[i](p);
							if (r.present) return r;
						}
						return $api.Function.Maybe.nothing();
					}
				}
			}
		}

		/** @typedef { { section: slime.project.jsapi.internal.InputLine["section"], content: string } } ParsedCommentLine */

		var parseComment = $api.Function.pipe(
			$$api.Function.switch(
				/** @type { (rest: string) => slime.$api.fp.Maybe<ParsedCommentLine> } */
				function(rest) {
					if (rest.substring(0,3) == "/**") return $api.Function.Maybe.value({
						section: "start",
						content: rest.substring(3).trim()
					});
					return $api.Function.Maybe.nothing();
				},
				function(rest) {
					if (rest.substring(0,3) == " */") return $api.Function.Maybe.value({
						section: "end",
						content: ""
					});
					return $api.Function.Maybe.nothing();
				},
				function(rest) {
					if (rest.substring(0,2) == " *") return $api.Function.Maybe.value({
						section: "middle",
						content: rest.substring(2).trim()
					});
					return $api.Function.Maybe.nothing();
				},
				function(rest) {
					return $api.Function.Maybe.value({
						section: null,
						content: rest
					})
				}
			),
			//	TODO	we have to force this else because of the inability to define the switch statement with an else currently
			$api.Function.Maybe.else(
				/** @returns { ParsedCommentLine } */
				function() {
					if (true) throw new Error("Unreachable.");
				}
			)
		)

		/**
		 *
		 * @param { string } line
		 * @returns { slime.project.jsapi.internal.InputLine }
		 */
		function parseLine(line) {
			var start = prefix(line);
			var rest = (start) ? line.substring(start.length) : line;
			var parsed = parseComment(rest);
			return {
				prefix: start,
				section: parsed.section,
				content: parsed.content
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

				/**
				 *
				 * @param { slime.project.jsapi.internal.InputLine[] } inputLines
				 * @return { slime.project.jsapi.internal.Block[] }
				 */
				function parseBlocks(inputLines) {
					return [
						{
							prefix: inputLines[0].prefix,
							tokens: inputLines.map($api.Function.property("content")).reduce(
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
							start: inputLines[0].section == "start",
							end: Boolean(inputLines[inputLines.length-1].section == "end")
						}
					]
				}

				return $api.Function.pipe(
					startEndTagReplace("code", "`"),
					startEndTagReplace("i", "*"),
					startEndTagReplace("em", "*"),
					$api.Function.string.split("\n"),
					$api.Function.Array.map(parseLine),
					function(inputLines) {
						var parsed = parseBlocks(inputLines)[0];

						var textLines = formatByLineLength(
							parsed.prefix,
							parsed.start,
							parsed.end
						)(parsed.tokens);

						//	TODO	figure out semantics and replace expression with named boolean variable or function
						if (!inputLines[inputLines.length-1].section && !inputLines[inputLines.length-1].prefix && !inputLines[inputLines.length-1].content)
							textLines.push("");

						//input = text(input);

						return textLines.join("\n");
					}
				)
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
