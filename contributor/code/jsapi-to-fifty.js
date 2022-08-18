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
				},
				/** @type { <P,R1,R2>(fs: [(p: P) => R1, (p: P) => R2]) => (p: P) => [R1, R2] } */
				split: function(fs) {
					//@ts-ignore
					return function(p) {
						return fs.map(function(f) {
							return f(p);
						});
					}
				},
				Array: {
					/** @type { <T>(ts: T[]) => slime.$api.fp.Maybe<T> } */
					first: function(array) {
						if (array.length > 0) return $api.Function.Maybe.value(array[0]);
						return $api.Function.Maybe.nothing();
					},
					/** @type { <T>(ts: T[]) => slime.$api.fp.Maybe<T> } */
					last: function(array) {
						if (array.length > 0) return $api.Function.Maybe.value(array[array.length-1]);
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

		/**
		 *
		 * @param { string } line
		 * @returns { slime.$api.fp.Maybe<string> } The indentation of the given line, or `null` if it cannot be determined
		 */
		function getLineIndent(line) {
			if (line.trim().substring(0,3) == "/**") {
				return $api.Function.Maybe.value(line.substring(0,line.indexOf("/**")));
			}
			if (line.trim().substring(0,1) == "*") {
				var at = line.indexOf("*");
				if (line.substring(at-1,at) != " ") {
					return $api.Function.Maybe.nothing();
				}
				return $api.Function.Maybe.value(line.substring(0,at-1));
			}
			var leadingWhitespacePattern = /^(\s+)/;
			var leadingWhitespaceMatch = leadingWhitespacePattern.exec(line);
			if (leadingWhitespaceMatch) {
				return $api.Function.Maybe.value(leadingWhitespaceMatch[1]);
			}
			return $api.Function.Maybe.nothing();
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
			var rest = (start.present) ? line.substring(start.value.length) : line;
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
			/**
			 * @param { string } input
			 */
			return function(input) {
				return input.replace(startPattern, delimiter).replace(endPattern, delimiter);
			}
		}

		var applyInlineStyles = $api.Function.pipe(
			startEndTagReplace("code", "`"),
			startEndTagReplace("i", "*"),
			startEndTagReplace("em", "*")
		);

		var parseInputLines = $api.Function.pipe(
			applyInlineStyles,
			$api.Function.string.split("\n"),
			$api.Function.Array.map(parseLine)
		);

		/**
		 *
		 * @param { slime.project.jsapi.internal.InputLine[] } inputLines
		 * @return { slime.project.jsapi.internal.Block }
		 */
		function parseBlock(inputLines) {
			var hasStart = $api.Function.result(
				inputLines,
				$api.Function.pipe(
					$$api.Function.Array.first,
					$api.Function.Maybe.map($api.Function.property("section")),
					$api.Function.Maybe.map($api.Function.is("start")),
					$api.Function.Maybe.else($api.Function.returning(false))
				)
			);

			var hasEnd = $api.Function.result(
				inputLines,
				$api.Function.pipe(
					$$api.Function.Array.last,
					$api.Function.Maybe.map($api.Function.property("section")),
					$api.Function.Maybe.map($api.Function.is("end")),
					$api.Function.Maybe.else($api.Function.returning(false))
				)
			);

			var content = inputLines.map($api.Function.property("content")).reduce(
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
			);

			debugger;

			return {
				prefix: (inputLines[0].prefix.present) ? inputLines[0].prefix.value : null,
				hasStart: hasStart,
				hasEnd: hasEnd,
				tokens: content
			}
		}

		/**
		 *
		 * @param { slime.project.jsapi.internal.InputLine } line
		 */
		function isEmpty(line) {
			return !line.section && !line.prefix && !line.content;
		}

		/**
		 * @param { slime.project.jsapi.Format } format
		 */
		function formatBlockUsing(format) {
			/**
			 * @param { slime.project.jsapi.internal.Block } block
			 * @returns { string[] }
			 */
			return function(block) {
				var content = block.tokens;
				/** @type { string[] } */
				var result = [];
				var index = 0;
				while(index < content.length) {
					var currentLine = function() { return result[result.length-1] };
					var currentWord = function() { return content[index]; }
					if (result.length == 0) {
						if (block.hasStart) {
							result.push(block.prefix + "/**");
						}
						result.push(block.prefix + " * ");
					}
					if (getDisplayLength(currentLine() + " " + currentWord(), format.tabSize) <= format.lineLength) {
						var hasWord = currentLine().length > (block.prefix + " * ").length;
						result[result.length-1] += (hasWord ? " " : "") + currentWord();
					} else {
						result.push(block.prefix + " * " + currentWord());
					}
					index++;
				}
				if (block.hasEnd) result.push(block.prefix + " */");
				return result;
			}
		}

		/**
		 *
		 * @param { slime.runtime.document.Node } child
		 * @returns { slime.$api.fp.Maybe<string> }
		 */
		function renderInlineNode(child) {
			if ($context.library.document.Node.isText(child)) {
				return $api.Function.Maybe.value(child.data);
			} else if ($context.library.document.Node.isComment(child)) {
				return $api.Function.Maybe.value("<!---- " + child.data + " --->");
			} else {
				return $api.Function.Maybe.nothing();
			}
		}

		/**
		 *
		 * @param { string } input
		 */
		function doIt(input) {
			var inputLines = parseInputLines(input);
			var block = parseBlock(inputLines);
			var content = block.tokens.join(" ");
			var decoded = $context.library.document.Fragment.codec.string.decode(content);
			/** @type { string[][] } */
			var rv = [
				[]
			];
			for (var i=0; i<decoded.children.length; i++) {
				var child = decoded.children[i];
				var inline = renderInlineNode(child);
				if (inline.present) {
					rv[rv.length-1].push(inline.value);
				} else if ($context.library.document.Node.isElement(child)) {
					if (child.name == "ul") {
						rv.push([]);
						child.children.forEach(function(node) {
							var inline = renderInlineNode(node);
							if (inline.present) {
								rv[rv.length-1].push(inline.value);
							} else if ($context.library.document.Node.isElement(node) && node.name == "li") {
								/** @type { slime.runtime.document.Text } */
								var bullet = {
									type: "text",
									data: "* "
								};
								/** @type { slime.runtime.document.Node[] } */
								var prefix = [ bullet ];
								var rendered = $context.library.document.Fragment.codec.string.encode({
									type: "fragment",
									children: prefix.concat(node.children)
								});
								rv.push([rendered]);
							} else {
								var html = $context.library.document.Fragment.codec.string.encode({
									type: "fragment",
									children: [node]
								});
								rv[rv.length-1].push(html);
							}
						});
					} else {
						rv.push(
							[
								$context.library.document.Fragment.codec.string.encode({
									type: "fragment",
									children: [child]
								})
							]
						)
					}
				}
			}
			return rv;
		}

		$export({
			test: {
				prefix: getLineIndent,
				maybeify: maybeify,
				split: $$api.Function.split,
				html: function(string) {
					return $context.library.document.Fragment.codec.string.decode(string);
				},
				parseBlocks: function(string) {
					return doIt(string);
				},
				formatBlockUsing: formatBlockUsing,
				library: {
					document: $context.library.document
				}
			},
			comment: function(format) {
				return $api.Function.pipe(
					parseInputLines,
					$$api.Function.split([
						$api.Function.pipe(
							parseBlock,
							formatBlockUsing(format)
						),
						$api.Function.pipe(
							$$api.Function.Array.last,
							$api.Function.Maybe.map(isEmpty),
							//	TODO	does the below make sense? Or should we simply assert?
							$api.Function.Maybe.else(function() { return false; })
						)
					]),
					function(result) {
						var blockLines = result[0];
						var isEmpty = result[1];

						var rv = blockLines.slice();
						if (isEmpty) rv.push("");
						return rv.join("\n");
					}
				)
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
