//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.loader.Export<slime.runtime.document.internal.source.Exports> } $export
	 */
	function($api,$export) {
		//	TODO	for HTML, use this: https://html.spec.whatwg.org/multipage/syntax.html#optional-tags

		/**
		 *
		 * @param { slime.runtime.document.internal.source.internal.Position } position
		 * @returns { string }
		 */
		function after(position) {
			return position.document.substring(position.offset);
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

		var format = {
			xml: {
				cdata: {
					start: "<![CDATA[",
					end: "]]>"
				}
			}
		}


		var State = (function() {
			/**
			 *
			 * @param { slime.runtime.document.internal.source.internal.State } state
			 * @returns
			 */
			var remaining = function(state) {
				return after(state.position);
			};
			return {
				remaining: remaining,

				/**
				 *
				 * @param { slime.runtime.document.internal.source.internal.State } state
				 * @param { slime.runtime.document.Node } node
				 * @param { number } advance
				 * @returns { slime.runtime.document.internal.source.internal.State }
				 */
				step: function(state,node,advance) {
					return {
						parsed: $api.Object.compose(state.parsed, { children: state.parsed.children.concat([node]) }),
						position: {
							document: state.position.document,
							offset: state.position.offset + advance
						}
					}
				},
				/**
				 *
				 * @param { slime.runtime.document.internal.source.internal.State } state
				 */
				atEnd: function(state) {
					if (state.position.offset > state.position.document.length) throw new Error("Attempt to read past end of input.");
					return state.position.offset == state.position.document.length
				},

				/**
				 *
				 * @param { slime.runtime.document.source.internal.State } state
				 */
				atXmlDeclaration: $api.fp.Predicate.and(
					function(state) {
						return state.position.offset == 0;
					},
					$api.fp.pipe(
						remaining,
						startsWith("<?xml")
					)
				),

				atXmlProcessingInstruction: $api.fp.pipe(
					remaining,
					startsWith("<?")
				),

				//	https://www.w3.org/TR/xml/#sec-cdata-sect
				atCdata: $api.fp.pipe(
					remaining,
					startsWith(format.xml.cdata.start)
				),

				atComment: $api.fp.pipe(
					remaining,
					startsWith("<!--")
				),

				atDoctype: $api.fp.pipe(
					remaining,
					//	TODO	case-insensitive
					startsWith("<!DOCTYPE")
				),

				atElement: $api.fp.pipe(
					remaining,
					$api.fp.Predicate.and(
						startsWith("<"),
						$api.fp.Predicate.not(startsWith("</"))
					)
				),

				atText: $api.fp.pipe(
					remaining,
					$api.fp.Predicate.not(startsWith("<"))
				)
			};
		})();

		var warnOnce = $api.fp.impure.Input.memoized(function() {
			debugger;
		});

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseXmlDeclaration = function(state) {
			var end = state.position.document.indexOf("?>");
			var xmlDeclaration = {
				type: "xml-declaration",
				data: state.position.document.substring("<?xml".length, end)
			};
			return State.step(state, xmlDeclaration, end + "?>".length);
		}

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseXmlProcessingInstruction = function(state) {
			var remaining = State.remaining(state);
			var pi = {
				type: "xml-processing-instruction",
				target: "",
				whitespace: "",
				data: ""
			};
			var index = "<?".length;
			while(remaining.substring(index,index+2) != "?>") {
				var next = remaining.substring(index,index+1);
				var isWhitespace = /\s/.test(next);
				if (pi.whitespace.length == 0) {
					//	still in target
					if (isWhitespace) {
						if (!pi.target.length) throw new Error("Processing instruction must have target.");
						//	end target
						pi.whitespace += next;
					} else {
						pi.target += next;
					}
				} else {
					if (!pi.data) {
						//	TODO	this might differ from XML spec, which I think has exactly 4 whitespace characters
						if (isWhitespace) {
							pi.whitespace += next;
						} else {
							pi.data = next;
						}
					} else {
						pi.data += next;
					}
				}
				index++;
			}
			return State.step(state, pi, index + "?>".length);
		}

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseCdata = function(state) {
			var remaining = State.remaining(state);
			//	https://www.w3.org/TR/xml/#sec-cdata-sect
			var end = remaining.indexOf(format.xml.cdata.end);
			if (end == -1) throw new Error("Unterminated CDATA section");
			/** @type { slime.runtime.document.xml.Cdata } */
			var cdata = {
				type: "cdata",
				data: remaining.substring(format.xml.cdata.start.length, end)
			};
			return State.step(state, cdata, end + format.xml.cdata.end.length);
		}

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseComment = function(state) {
			var left = State.remaining(state);
			var end = left.indexOf("-->");
			if (end == -1) throw new Error("Comment not closed.");
			/** @type { slime.runtime.document.Comment } */
			var comment = {
				type: "comment",
				data: left.substring("<!--".length, end)
			};
			return State.step(state, comment, end + "-->".length);
		}

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseDoctype = function(state) {
			var left = State.remaining(state);
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
			return State.step(state, doctype, end + ">".length);
		};

		/**
		 * @type { slime.runtime.document.internal.source.internal.Step }
		 */
		var parseText = function(state) {
			var left = State.remaining(state);
			var end = left.indexOf("<");
			if (end == -1) end = left.length;
			/** @type { slime.runtime.document.Text } */
			var text = {
				type: "text",
				data: left.substring(0,end)
			};
			return State.step(state, text, end);
		}

		var voidElements = ["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"];

		var isVoidElement = function(tagName) {
			return voidElements.some(function(type) {
				return type.toLowerCase() == tagName.toLowerCase()
			});
		}

		var endTagMatch = /^\<\/(.*?)(\s*)\>/;

		var startsWithEndTagFor = function(name) {
			return function(string) {
				var parsed = endTagMatch.exec(string);
				if (parsed) {
					return parsed[1].toLowerCase() == name.toLowerCase();
				}
			}
		}

		var startsWithEndTag = function(string) {
			return endTagMatch.exec(string) != null;
		}

		var startingEndTag = function(string) {
			var parsed = endTagMatch.exec(string);
			return parsed[0];
		}

		/**
		 *
		 * @param { string } c
		 * @returns { boolean }
		 */
		function isWhitespace(c) {
			return /\s/.test(c);
		}

		/** @type { slime.runtime.document.internal.source.internal.Export["parseStartTag"] } */
		function parseStartTag(string) {
			var index = 0;
			/** @type { ReturnType<slime.runtime.document.internal.source.internal.Export["parseStartTag"]> } */
			var rv = {
				tag: "",
				attributes: "",
				selfclose: void(0)
			}
			var tag = "";

			//	TODO	does array subscript notation work in Rhino?
			var at = function(index) {
				return string.substring(index,index+1);
			};

			while(!isWhitespace(at(index)) && at(index) != "/" && index < string.length) {
				rv.tag += at(index++);
			}

			if (string.substring(string.length-1) == "/") {
				rv.attributes = string.substring(index, string.length-1);
				rv.selfclose = true;
			} else {
				rv.attributes = string.substring(index);
				rv.selfclose = false;
			}

			return rv;
		}

		/**
		 * @param { slime.runtime.document.Settings } settings
		 * @param { slime.runtime.document.internal.source.internal.State } state
		 * @param { slime.$api.event.Producer<slime.runtime.document.internal.source.ParseEvents> } events
		 * @param { slime.runtime.document.internal.source.internal.Parser<slime.runtime.document.Parent> } recurse
		 * @returns { slime.runtime.document.internal.source.internal.State }
		 */
		var parseElement = function(settings,state,events,recurse) {
			//	TODO	special handling for SCRIPT
			//	TODO	parse attributes
			//	TODO	deal with self-closing tags
			//	TODO	deal with variety of https://html.spec.whatwg.org/multipage/syntax.html#optional-tags
			//	TODO	deal with case-insensitivity

			var closingTag = function(tagName) {
				return "</" + tagName + ">";
			}

			var findContentStart = function(left) {
				return left.indexOf(">") + ">".length;
			}

			var toAttributes = function(list,string) {
				if (string.length == 0) return list;
				/** @type { slime.runtime.document.Attribute } */
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

			var left = State.remaining(state);
			var startTag = left.substring(1, left.indexOf(">"));
			events.fire("startTag", "Parsing start tag " + startTag);
			var parsed = parseStartTag(startTag);
			var selfclosing = parsed.selfclose;
			var tagName = parsed.tag;
			events.fire("startElement", tagName);

			var attributes = toAttributes([], parsed.attributes);

			/** @type { slime.runtime.document.internal.source.internal.State<slime.runtime.document.Element> } */
			var substate = {
				parsed: {
					type: "element",
					name: tagName,
					attributes: attributes,
					selfClosing: selfclosing,
					children: [],
					endTag: null
				},
				position: {
					document: state.position.document,
					offset: state.position.offset + findContentStart(left)
				}
			};

			var isVoid = !settings.xml && isVoidElement(tagName);

			if (!selfclosing && !isVoid) {
				var after = recurse(
					substate,
					events,
					$api.fp.pipe(
						State.remaining,
						$api.fp.Predicate.or(
							startsWithEndTag,
							function(string) { return !Boolean(string.length) }
						)
					)
				);

				var endTag = $api.fp.pipe(
					State.remaining,
					startsWithEndTagFor(tagName),
					function(closing) {
						return (closing) ? closingTag(tagName) : ""
					}
				)(after);

				after.parsed["endTag"] = (function() {
					var remaining = State.remaining(after);
					if (!remaining) return "";
					if (startsWithEndTagFor(tagName)(remaining)) return startingEndTag(remaining);
					return "";
				})();

				events.fire("endElement", tagName);

				return {
					parsed: $api.Object.compose(state.parsed, {
						children: state.parsed.children.concat([after.parsed])
					}),
					position: {
						document: after.position.document,
						offset: after.position.offset + endTag.length
					}
				}
			} else {
				substate.parsed.endTag = "";
				events.fire("endElement", tagName);
				return {
					parsed: $api.Object.compose(state.parsed, {
						children: state.parsed.children.concat([substate.parsed])
					}),
					position: substate.position
				};
			}
		}

		/**
		 * @param { slime.runtime.document.Settings } configuration
		 * @returns { slime.runtime.document.internal.source.internal.Parser<slime.runtime.document.Parent> }
		 */
		var Parser = function(configuration) {
			/**
			 *
			 * @param { slime.runtime.document.internal.source.internal.State } state
			 * @param { slime.$api.event.Producer<slime.runtime.document.internal.source.ParseEvents> } events
			 * @param { (state: slime.runtime.document.internal.source.internal.State) => boolean } finished
			 * @returns { slime.runtime.document.internal.source.internal.State }
			 */
			return function recurse(state,events,finished) {
				if (finished(state)) {
					return state;
				}

				/** @type { slime.runtime.document.internal.source.internal.State } */
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

				if (State.atXmlDeclaration(state)) {
					next = parseXmlDeclaration(state);
				} else if (State.atXmlProcessingInstruction(state)) {
					next = parseXmlProcessingInstruction(state);
				} else if (State.atCdata(state)) {
					next = parseCdata(state);
				} else if (State.atComment(state)) {
					next = parseComment(state);
				} else if (State.atDoctype(state)) {
					next = parseDoctype(state);
				} else if (State.atElement(state)) {
					next = parseElement(configuration,state,events,recurse);
				} else if (State.atText(state)) {
					next = parseText(state);
				} else {
					//	skip to end of the thing
					/** @type { slime.runtime.document.internal.source.internal.Unparsed } */
					var rest = {
						type: "unparsed",
						string: State.remaining(state)
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
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Comment } */
		var isComment = function(node) {
			return node.type == "comment";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Text } */
		var isText = function(node) {
			return node.type == "text";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Doctype } */
		var isDoctype = function(node) {
			return node.type == "doctype";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Document } */
		var isDocument = function(node) {
			return node.type == "document";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Element } */
		var isElement = function(node) {
			return node.type == "element";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Fragment } */
		var isFragment = function(node) {
			return node.type == "fragment";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.xml.Declaration } */
		var isXmlDeclaration = function(node) {
			return node.type == "xml-declaration";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.xml.ProcessingInstruction } */
		var isXmlProcessingInstruction = function(node) {
			return node.type == "xml-processing-instruction";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.Parent } */
		var isParent = function(node) {
			return node.type == "document" || node.type == "element" || node.type == "fragment";
		};

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.xml.Cdata } */
		var isCdata = function(node) {
			return node.type == "cdata";
		}

		/** @type { (node: slime.runtime.document.Node) => node is slime.runtime.document.String } */
		var isString = function(node) {
			return node.type == "text" || node.type == "cdata";
		}

		var Serializer = function(configuration) {
			/**
			 *
			 * @param { slime.runtime.document.Attribute } attribute
			 * @returns { string }
			 */
			function serializeAttribute(attribute) {
				var rv = attribute.whitespace;
				if (attribute.name) {
					rv += attribute.name;
					if (attribute.value !== null) {
						rv += "=";
						rv += attribute.quote + attribute.value + attribute.quote
					}
				}
				return rv;
			}

			return function recurse(node) {
				if (isXmlDeclaration(node)) {
					return "<?xml" + node.data + "?>";
				} else if (isXmlProcessingInstruction(node)) {
					return "<?" + node.target + node.whitespace + node.data + "?>";
				} else if (isCdata(node)) {
					return format.xml.cdata.start + node.data + format.xml.cdata.end;
				} else if (isComment(node)) {
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
						+ node.endTag
					);
				}
				return "";
			}
		}

		/**
		 *
		 * @type { slime.runtime.document.internal.source.Exports["parse"] }
		 */
		var parse = {
			document: function(input) {
				var events = $api.events.Handlers.attached(input.events);
				var state = Parser(input.settings)(
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
					events,
					State.atEnd
				);
				$api.events.Handlers.detach(events);
				if (isDocument(state.parsed)) return state.parsed;
			},
			fragment: function(input) {
				var events = $api.events.Handlers.attached(input.events);
				var state = Parser(input.settings)(
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
					events,
					State.atEnd
				);
				$api.events.Handlers.detach(events);
				if (isFragment(state.parsed)) return state.parsed;
			}
		}

		var serialize = function(output) {
			var serialize = Serializer();
			var parent = (function() {
				if (output.document) return output.document;
				if (output.fragment) return output.fragment;
			})();
			return parent.children.map(serialize).join("");
		}

		/**
		 *
		 * @param { string } input
		 * @param { slime.$api.event.Producer<{ console: string }> } events
		 */
		var debugFidelity = function(input, events) {
			var console = function(string) {
				events.fire("console", string);
			};

			/** @type { slime.runtime.document.Settings } */
			var settings = {};

			var document = parse.document({
				settings: settings,
				string: input,
				events: (function() {
					/** @type { string[] } */
					var stack = [];
					/**
					 * @type { slime.$api.event.Handlers<slime.runtime.document.internal.source.ParseEvents> }
					 */
					var rv = {
						startElement: function(e) {
							console(e.detail);
							stack.push(e.detail);
							console("Stack " + stack.join(" "));
						},
						endElement: function(e) {
							console("/" + e.detail);
							if (stack[stack.length-1] == e.detail) {
								stack.pop();
							} else {
								console("Expected end tag for " + stack[stack.length-1] + " not " + e.detail);
							}
						}
					}
					return rv;
				})()
			});

			console("Parsed.");

			var serialized = serialize({
				settings: settings,
				document: document
			});

			console("Serialized.");

			var match = 1;
			while( (input.substring(0,match) == serialized.substring(0,match)) && match < input.length) {
				match++;
			}

			if (match < input.length) {
				console("input and output of parsing and serializing input are not the same");
				console("input after divergence " + input.substring(match));
				console("output after divergence " + serialized.substring(match));
			}

			return input == serialized;
		}

		$export({
			debug: {
				fidelity: function(p) {
					var events = $api.events.Handlers.attached(p.events);
					var rv = debugFidelity(p.markup, events);
					$api.events.Handlers.detach(events);
					return rv;
				}
			},
			parse: parse,
			serialize: {
				document: serialize,
				fragment: serialize
			},
			Node: {
				isComment: isComment,
				isText: isText,
				isFragment: isFragment,
				isDocument: isDocument,
				isElement: isElement,
				isDoctype: isDoctype,
				isParent: isParent,
				isString: isString
			},
			Text: {
				from: {
					data: function(data) { return { type: "text", data: data }; }
				}
			},
			Element: {
				from: (function() {
					/** @type { slime.$api.fp.Mapping<slime.runtime.document.element.from.Attribute,slime.runtime.document.Attribute> } */
					var attribute = function(spec) {
						return {
							name: spec.name,
							quote: "\"",
							value: spec.value,
							whitespace: " "
						}
					};

					return {
						parent: function(p) {
							return {
								type: "element",
								name: p.name,
								attributes: (p.attributes || []).map(attribute),
								children: p.children || [],
								endTag: "</" + p.name + ">",
								selfClosing: false
							}
						}
					};
				})()
			},
			internal: {
				parseStartTag: parseStartTag
			}
		})
	}
//@ts-ignore
)($api,$export);
