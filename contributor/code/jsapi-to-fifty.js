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
		//	TODO	should this return Maybe?
		/**
		 *
		 * @param { string } line
		 * @returns { string } The indentation of the given line, or `null` if it cannot be determined
		 */
		function getLineIndent(line) {
			if (line.trim().substring(0,3) == "/**") {
				return line.substring(0,line.indexOf("/**"));
			}
			if (line.trim().substring(0,1) == "*") {
				var at = line.indexOf("*");
				if (line.substring(at-1,at) != " ") {
					return null;
				}
				return line.substring(0,at-1);
			}
			var leadingWhitespacePattern = /^(\s+)/;
			var leadingWhitespaceMatch = leadingWhitespacePattern.exec(line);
			if (leadingWhitespaceMatch) {
				return leadingWhitespaceMatch[1];
			}
			return null;
		}

		/**
		 *
		 * @param { string } line
		 * @param { number } tabSize
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
		};

		/** @type { slime.project.jsapi.fp.Maybeify } */
		var maybeify = function() {
			return function(f) {
				return function() {
					var result = f.apply(this,arguments);
					return $api.Function.Maybe.from(result);
				}
			}
		};

		var toMaybe = maybeify();

		/** @typedef { { section: slime.project.jsapi.internal.InputLine["section"], content: string } } ParsedCommentLine */

		var parseComment = $api.Function.pipe(
			$$api.Function.switch(
				toMaybe(
					/** @type { (rest: string) => ParsedCommentLine } */
					function(rest) {
						if (rest.substring(0,3) == "/**") return {
							section: "start",
							content: rest.substring(3).trim()
						}
					}
				),
				toMaybe(
					/** @type { (rest: string) => ParsedCommentLine } */
					function(rest) {
						if (rest.substring(0,3) == " */") return {
							section: "end",
							content: ""
						};
					}
				),
				toMaybe(
					/** @type { (rest: string) => ParsedCommentLine } */
					function(rest) {
						if (rest.substring(0,2) == " *") return {
							section: "middle",
							content: rest.substring(2).trim()
						};
					}
				),
				toMaybe(
					/** @type { (rest: string) => ParsedCommentLine } */
					function(rest) {
						return {
							section: null,
							content: rest
						}
					}
				)
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
			var start = getLineIndent(line);
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
		 * @param { slime.project.jsapi.internal.InputLine } line
		 */
		function isEmpty(line) {
			return !line.section && !line.prefix && !line.content;
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

		/**
		 * @param { slime.project.jsapi.Format } format
		 * @param { string } prefix The indent to use
		 * @param { boolean } hasStart Whether the start of this content is the start of a comment
		 * @param { boolean } hasEnd Whether the start of this content is the end of a comment
		 */
		function formatByLineLength(format, prefix, hasStart, hasEnd) {
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

		$export({
			test: {
				prefix: getLineIndent,
				maybeify: maybeify
			},
			comment: function(format) {
				//	TODO	make format an argument to below rather than a scope variable

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

				/**
				 *
				 * @param { slime.project.jsapi.internal.Block } parsed
				 */
				var formatBlock = function(parsed) {
					var textLines = formatByLineLength(
						format,
						parsed.prefix,
						parsed.start,
						parsed.end
					)(parsed.tokens);
					return textLines;
				}

				return $api.Function.pipe(
					startEndTagReplace("code", "`"),
					startEndTagReplace("i", "*"),
					startEndTagReplace("em", "*"),
					$api.Function.string.split("\n"),
					$api.Function.Array.map(parseLine),
					function(inputLines) {
						var blockLines = $api.Function.Arrays.join(parseBlocks(inputLines).map(formatBlock));

						if (isEmpty(inputLines[inputLines.length-1])) {
							blockLines.push("");
						}

						return blockLines.join("\n");
					}
				)
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
