//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.loader.Export<slime.runtime.document.source.Export> } $export
	 */
	function($api,$export) {
		//	TODO	for HTML, use this: https://html.spec.whatwg.org/multipage/syntax.html#optional-tags

		/**
		 *
		 * @param { slime.runtime.document.source.internal.Position } position
		 * @returns { string }
		 */
		function after(position) {
			return position.document.substring(position.offset);
		}

		/**
		 *
		 * @param { slime.runtime.document.source.internal.State } state
		 * @returns
		 */
		function remaining(state) {
			return after(state.position);
		}

		/**
		 *
		 * @param { string } prefix
		 * @returns { (input: string) => boolean }
		 */
		function startsWith(prefix) {
			return function(string) {
				return string.substring(0,prefix.length) == prefix;
			}
		}

		/**
		 *
		 * @param { slime.runtime.document.source.internal.State } state
		 * @param { slime.runtime.document.source.Node } node
		 * @param { number } advance
		 * @returns { slime.runtime.document.source.internal.State }
		 */
		var step = function(state,node,advance) {
			return {
				parsed: $api.Object.compose(state.parsed, { children: state.parsed.children.concat([node]) }),
				position: {
					document: state.position.document,
					offset: state.position.offset + advance
				}
			}
		}

		var atComment = $api.Function.pipe(
			remaining,
			startsWith("<!--")
		);

		var atDoctype = $api.Function.pipe(
			remaining,
			//	TODO	case-insensitive
			startsWith("<!DOCTYPE")
		);

		var atElement = $api.Function.pipe(
			remaining,
			$api.Function.Predicate.and(
				startsWith("<"),
				$api.Function.Predicate.not(startsWith("</"))
			)
		);

		var atText = $api.Function.pipe(
			remaining,
			$api.Function.Predicate.not(startsWith("<"))
		)

		/**
		 * @type { slime.runtime.document.source.internal.Step }
		 */
		var parseComment = function(state) {
			var left = remaining(state);
			var end = left.indexOf("-->");
			if (end == -1) throw new Error("Comment not closed.");
			/** @type { slime.runtime.document.source.Comment } */
			var comment = {
				type: "comment",
				data: left.substring("<!--".length, end)
			};
			return step(state, comment, end + "-->".length);
		}

		/**
		 * @type { slime.runtime.document.source.internal.Step }
		 */
		var parseDoctype = function(state) {
			var left = remaining(state);
			var end = left.indexOf(">");
			if (end == -1) throw new Error("DOCTYPE not closed.");
			var content = left.substring("<!DOCTYPE".length,end);
			var parser = /^(\s+)(\S+)(.*)/
			var parsed = parser.exec(content);
			if (!parsed) throw new Error("Malformed DOCTYPE: [" + content + "]");
			var doctype = {
				type: "doctype",
				before: parsed[1],
				name: parsed[2],
				after: parsed[3]
			};
			return step(state, doctype, end + ">".length);
		}

		/**
		 * @type { slime.runtime.document.source.internal.Step }
		 */
		var parseText = function(state) {
			var left = remaining(state);
			var end = left.indexOf("<");
			if (end == -1) end = left.length;
			/** @type { slime.runtime.document.source.Text } */
			var text = {
				type: "text",
				data: left.substring(0,end)
			};
			return step(state, text, end);
		}

		var voidElements = ["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"];

		/**
		 * @param { slime.runtime.document.source.internal.State } state
		 * @param { slime.$api.Events<slime.runtime.document.source.ParseEvents> } events
		 * @param { slime.runtime.document.source.internal.Parser<slime.runtime.document.source.Parent> } recurse
		 * @returns { slime.runtime.document.source.internal.State }
		 */
		var parseElement = function(state,events,recurse) {
			//	TODO	special handling for SCRIPT
			//	TODO	parse attributes
			//	TODO	deal with self-closing tags
			//	TODO	deal with variety of https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
			//	TODO	deal with case-insensitivity

			var closingTag = function(tagName) {
				return "</" + tagName + ">";
			}

			var findEnd = function(left,tagName) {
				return left.indexOf(closingTag(tagName));
			}

			var findContentStart = function(left) {
				return left.indexOf(">") + ">".length;
			}

			var toAttributes = function(list,string) {
				if (string.length == 0) return list;
				/** @type { slime.runtime.document.source.Attribute } */
				var attribute = {
					whitespace: "",
					name: null,
					quote: "",
					value: null
				};
				var index = 0;
				var current = function() {
					return string.substring(index,index+1);
				}
				var next = function() {
					index++;
				}
				var isWhitespace = function() {
					return /\s/.test(current());
				}
				var isName = function() {
					return current() != "=" && /\S/.test(current());
				}
				var isDone = function() {
					return index >= string.length;
				}
				while(isWhitespace()) {
					attribute.whitespace += current();
					next();
				}
				while(isName()) {
					if (!attribute.name) attribute.name = "";
					attribute.name += current();
					next();
				}
				if (current() == "=") {
					next();
					//	Does not handle single quotes or unquoted
					if (current() == "\"") {
						attribute.quote = "\"";
						next();
						attribute.value = "";
						while(current() != "\"") {
							attribute.value += current();
							next();
						}
						//	skip second quote
						next();
					} else if (current() == "'") {
						attribute.quote = "'";
						next();
						attribute.value = "";
						while(current() != "'") {
							attribute.value += current();
							next();
						}
						//	skip second quote
						next();
					} else {
						attribute.value = "";
						while(!isWhitespace() && !isDone()) {
							attribute.value += current();
							next();
						}
					}
				}
				return toAttributes(list.concat([ attribute ]), string.substring(index));
			}

			var left = remaining(state);
			var startTag = left.substring(1, left.indexOf(">"));
			events.fire("startElement", "Parsing start tag " + startTag);
			var parser = /^(\S+)(.*?)(\/?)(\s*)$/m;
			var parsed = parser.exec(startTag);
			var selfclosing = Boolean(parsed[3].length);
			if (!parsed) throw new Error("Could not parse start tag: [" + startTag + "]");
			var tagName = parsed[1];

			var attributes = toAttributes([], parsed[2]);

			/** @type { slime.runtime.document.source.internal.State<slime.runtime.document.source.Element> } */
			var substate = {
				parsed: {
					type: "element",
					name: tagName,
					attributes: attributes,
					selfClosing: selfclosing,
					children: []
				},
				position: {
					document: state.position.document,
					offset: state.position.offset + findContentStart(left)
				}
			};

			if (!selfclosing) {
				var after = recurse(
					substate,
					events,
					$api.Function.pipe(
						remaining,
						startsWith(closingTag(tagName))
					)
				);
				return {
					parsed: $api.Object.compose(state.parsed, {
						children: state.parsed.children.concat([after.parsed])
					}),
					position: {
						document: after.position.document,
						offset: after.position.offset + closingTag(tagName).length
					}
				}
			} else {
				return {
					parsed: $api.Object.compose(state.parsed, {
						children: state.parsed.children.concat([substate.parsed])
					}),
					position: substate.position
				};
			}
		}

		/** @returns { slime.runtime.document.source.internal.Parser<slime.runtime.document.source.Parent> } */
		var Parser = function(configuration) {
			/**
			 *
			 * @param { slime.runtime.document.source.internal.State } state
			 * @param { slime.$api.Events<slime.runtime.document.source.ParseEvents> } events
			 * @param { (state: slime.runtime.document.source.internal.State) => boolean } finished
			 * @returns { slime.runtime.document.source.internal.State }
			 */
			var rv = function recurse(state,events,finished) {
				if (finished(state)) {
					return state;
				}

				/** @type { slime.runtime.document.source.internal.State } */
				var next;

				//	HTML stuff
				//	TODO	element (with attributes)
				//			for HTML, use this: https://html.spec.whatwg.org/multipage/syntax.html#optional-tags


				//	DOM-ish stuff
				//	TODO	document fragment

				//	XML-ish stuff
				//	https://www.w3.org/TR/2008/REC-xml-20081126/

				//	TODO	<!CDATA		CDATA
				//	TODO	<?			XML processing instruction (and prolog)

				//	deprecated
				//	TODO	<!ENTITY	entity reference
				//	TODO	<!ENTITY	entity node
				//	TODO	<!NOTATION	notation node

				if (atComment(state)) {
					next = parseComment(state);
				} else if (atDoctype(state)) {
					next = parseDoctype(state);
				} else if (atElement(state)) {
					next = parseElement(state,events,recurse);
					if (!next.parsed.type) debugger;
				} else if (atText(state)) {
					next = parseText(state);
				} else {
					//	skip to end of the thing
					/** @type { slime.runtime.document.source.internal.Unparsed } */
					var rest = {
						type: "unparsed",
						string: remaining(state)
					}
					next = {
						parsed: {
							type: "document",
							children: state.parsed.children.concat([
								rest
							])
						},
						position: {
							document: state.position.document,
							offset: state.position.document.length
						}
					}
				}

				return recurse(next, events, finished);
			};
			return rv;
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Comment } */
		var isComment = function(node) {
			return node.type == "comment";
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Text } */
		var isText = function(node) {
			return node.type == "text";
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Doctype } */
		var isDoctype = function(node) {
			return node.type == "doctype";
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Document } */
		var isDocument = function(node) {
			return node.type == "document";
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Element } */
		var isElement = function(node) {
			return node.type == "element";
		}

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Fragment } */
		var isFragment = function(node) {
			return node.type == "fragment";
		}

		var Serializer = function(configuration) {
			/**
			 *
			 * @param { slime.runtime.document.source.Attribute } attribute
			 * @returns { string }
			 */
			function serializeAttribute(attribute) {
				var rv = attribute.whitespace;
				if (attribute.name) {
					rv += attribute.name;
					if (attribute.value) {
						rv += "=";
						rv += attribute.quote + attribute.value + attribute.quote
					}
				}
				return rv;
			}

			return function recurse(node) {
				if (isComment(node)) {
					return "<!--" + node.data + "-->";
				} else if (isText(node)) {
					return node.data;
				} else if (isDoctype(node)) {
					return "<!DOCTYPE" + node.before + node.name + node.after + ">";
				} else if (isElement(node)) {
					return ("<"
						+ node.name + node.attributes.map(serializeAttribute).join("")
						+ ((node.selfClosing) ? "/" : "") + ">"
						+ node.children.map(recurse).join("")
						+ ((node.selfClosing) ? "" : "</" + node.name + ">")
					);
				}
				return "";
			}
		}

		$export({
			parse: function(input) {
				var events = $api.Events.toHandler(input.events);
				events.attach();
				var state = Parser()(
					{
						parsed: {
							type: "document",
							children: []
						},
						position: {
							document: input.string,
							offset: 0
						}
					},
					events.emitter,
					function(state) {
						return state.position.offset == state.position.document.length
					}
				);
				events.detach();
				if (isDocument(state.parsed)) return state.parsed;
			},
			fragment: function(input) {
				var events = $api.Events.toHandler(input.events);
				events.attach();
				var state = Parser()(
					{
						parsed: {
							type: "fragment",
							children: []
						},
						position: {
							document: input.string,
							offset: 0
						}
					},
					events.emitter,
					function(state) {
						return state.position.offset == state.position.document.length
					}
				);
				events.detach();
				if (isFragment(state.parsed)) return state.parsed;
			},
			serialize: function(output) {
				var serialize = Serializer();
				var parent = (function() {
					if (output.document) return output.document;
					if (output.fragment) return output.fragment;
				})();
				return parent.children.map(serialize).join("");
			}
		})
	}
//@ts-ignore
)($api,$export);
