//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { any } $platform
	 * @param { slime.$api.Global } $api
	 * @param { slime.runtime.document.Context } $context
	 * @param { slime.Loader } $loader
	 * @param { slime.loader.Export<slime.runtime.document.Exports> } $export
	 */
	function($platform,$api,$context,$loader,$export) {
		var code = {
			/** @type { slime.runtime.document.internal.source.Script } */
			source: $loader.script("source.js"),
			/** @type { slime.runtime.document.old.Script } */
			old: $loader.script("old.js")
		};

		var source = code.source();

		/**
		 *
		 * @param { slime.runtime.document.Parent } root
		 * @param { number[] } cursor
		 * @returns { slime.$api.fp.Stream<slime.runtime.document.Node> }
		 */
		function NodesStream(root, cursor) {
			/** @type { slime.js.Cast<slime.runtime.document.Parent> } */
			var asParent = $api.fp.cast.unsafe;

			/**
			 *
			 * @param { slime.runtime.document.Parent } root
			 * @param { number[] } cursor
			 * @returns { slime.runtime.document.Node }
			 */
			var getNode = function(root,cursor) {
				/** @type { slime.runtime.document.Node } */
				var position = root;
				for (var i=0; i<cursor.length; i++) {
					position = asParent(position).children[cursor[i]];
				}
				return position;
			}

			var checkParent = function recurse(root, cursor) {
				if (cursor.length == 0) return null;
				var parentCursor = cursor.slice(0, cursor.length-1);
				var index = cursor[cursor.length-1];
				var parent = asParent(getNode(root, parentCursor));
				if (index+1 < parent.children.length) {
					return parentCursor.concat([index+1]);
				} else {
					return checkParent(root, parentCursor);
				}
			}

			return function() {
				/** @type { slime.runtime.document.Node } */
				var position = getNode(root, cursor);
				/** @type { number[] } */
				var next;
				//	find the next one
				if (source.Node.isParent(position) && position.children.length > 0) {
					next = cursor.concat([0]);
				} else {
					next = checkParent(root, cursor);
				}
				return {
					next: $api.fp.Maybe.from.some(position),
					remaining: (next) ? NodesStream(root, next) : $api.fp.Stream.from.empty()
				};
			};
		}

		var escaping = (
			function() {
				// fifty.tests.escaping = function() {
				// 	//	XML specification: https://www.w3.org/TR/2006/REC-xml11-20060816/
				// 	var codec = function(xml,data) {
				// 		var document = api.parse.document({ settings: settings, string: xml });
				// 		var element = document.children[0] as Element;
				// 		var content = element.children[0] as Text;
				// 		verify(content).data.is(data);

				// 		var serialized = api.serialize.document({ settings: settings, document: document });
				// 		verify(serialized).is(xml);
				// 	};

				// 	codec("<root>Ben &amp; Jerry</root>", "Ben & Jerry");
				// 	codec("<root>1 &lt; 2</root>", "1 < 2");
				// }

				var escapes = {
					amp: {
						character: "&",
						must: true
					},
					lt: {
						character: "<",
						must: true
					}
				};
				return {
					encode: function(string) {
						var rv = string;
						for (var x in escapes) {
							if (escapes[x].must) {
								rv = rv.replace(new RegExp(escapes[x].character), "&" + x + ";");
							}
						}
						return rv;
					},
					decode: function(string) {
						var rv = string;
						for (var x in escapes) {
							rv = rv.replace(new RegExp("\&" + x + ";", "g"), escapes[x].character);
						}
						return rv;
					}
				}
			}
		)();

		var Elements = {
			isName: function(name) {
				return function(element) {
					return element.name == name;
				}
			},
			getAttribute: function(name) {
				return function(element) {
					var match = element.attributes.filter(function(attribute) {
						return attribute.name == name;
					})[0];
					return (match) ? $api.fp.Maybe.from.some(match.value) : $api.fp.Maybe.from.nothing();
				}
			},
			from: source.Element.from
		};

		/** @type { slime.runtime.document.Exports } */
		var rv = {
			load: code.old($context).load,
			Node: $api.Object.compose(
				source.Node,
				/** @type { Pick<slime.runtime.document.node.Exports,"isElementNamed"|"hasChild"> } */({
					isElementNamed: function(name) {
						return $api.fp.Predicate.and([
							source.Node.isElement,
							Elements.isName(name)
						]);
					},
					hasChild: function(f) {
						return function(node) {
							if (!source.Node.isParent(node)) return false;
							return Boolean(node.children.find(f));
						}
					}
				})
			),
			Text: source.Text,
			Parent: {
				nodes: function(p) {
					return NodesStream(p, []);
				},
				child: {
					index: {
						simple: function(index) {
							if (index < 0) throw new Error();
							return function(parent) {
								if (index >= parent.children.length) throw new Error();
								return parent.children[index];
							}
						}
					}
				},
				content: {
					set: {
						nodes: function(get) {
							return function(p) {
								p.children = get(p);
							}
						},
						text: function(s) {
							return function(p) {
								p.children = [ /** @type { slime.runtime.document.Text } */({ type: "text", data: s }) ];
							}
						}
					},
					get: {
						string: {
							simple: function(p) {
								var rv = "";
								for (var i=0; i<p.children.length; i++) {
									var child = p.children[i];
									if (!source.Node.isString(child)) throw new Error("Expected child " + i + " to be string.");
									rv += child.data;
								}
								return rv;
							}
						}
					},
					text: {
						set: function(p) {
							p.parent.children = [ /** @type { slime.runtime.document.Text } */({ type: "text", data: p.data }) ];
						}
					}
				}
			},
			Fragment: {
				codec: {
					string: (function() {
						/** @type { slime.runtime.document.Settings } */
						var settings = {};
						return {
							decode: function(string) {
								return source.parse.fragment({ settings: settings, string: string });
							},
							encode: function(fragment) {
								return source.serialize.fragment({ settings: settings, fragment: fragment });
							}
						}
					})()
				}
			},
			Element: {
				isName: function(name) {
					return function(element) {
						return element.name == name;
					}
				},
				getAttribute: function(name) {
					return function(element) {
						var match = element.attributes.filter(function(attribute) {
							return attribute.name == name;
						})[0];
						return (match) ? $api.fp.Maybe.from.some(match.value) : $api.fp.Maybe.from.nothing();
					}
				},
				from: source.Element.from
			},
			Document: {
				edit: function(f) {
					/** @type { slime.runtime.document.Settings } */
					var settings = {};
					return function(string) {
						var document = source.parse.document({ settings: settings, string: string });
						f(document);
						return source.serialize.document({ settings: settings, document: document });
					}
				},
				codec: {
					string: (function() {
						/** @type { slime.runtime.document.Settings } */
						var settings = {};
						return {
							decode: function(string) {
								return source.parse.document({ settings: settings, string: string });
							},
							encode: function(document) {
								return source.serialize.document({ settings: settings, document: document });
							}
						}
					})()
				},
				from: {
					string: function(settings) {
						return function(string) {
							return source.parse.document({ settings: settings, string: string });
						}
					}
				},
				removeWhitespaceTextNodes: function(document) {
					/**
					 * @template { slime.runtime.document.Node } T
					 * @param { T } node
					 * @returns { T }
					 */
					var convert = function(node) {
						var copy = $api.Object.compose(node);
						if (source.Node.isParent(copy)) {
							copy.children = copy.children.filter(function(node) {
								return !(source.Node.isText(node) && !node.data.trim())
							}).map(convert)
						}
						return copy;
					};

					return convert(document);
				},
				prettify: function(p) {
					/**
					 *
					 * @param { string } data
					 * @returns { slime.runtime.document.Text }
					 */
					function text(data) {
						return {
							type: "text",
							data: data
						}
					}

					/**
					 * @template { slime.runtime.document.Node } T
					 * @param { T } node
					 * @returns { T }
					 */
					function convert(node,depth) {
						var copy = $api.Object.compose(node);
						if (source.Node.isElement(copy)) {
							copy.children = copy.children.filter(function(node) {
								return !(source.Node.isText(node) && !node.data.trim())
							});
							//	We omit newlining and indentation for elements with a single text child
							var hasOneTextChild = copy.children.length == 1 && source.Node.isText(copy.children[0]);
							/** @type { slime.runtime.document.Node[] } */
							var result = [];
							copy.children = copy.children.reduce(function(rv,child,index,children) {
								if (!hasOneTextChild) rv.push(text("\n" + $api.fp.string.repeat(depth+1)(p.indent)));
								rv.push(convert(child,depth+1));
								if (index+1 == children.length) {
									if (!hasOneTextChild) rv.push(text("\n" + $api.fp.string.repeat(depth)(p.indent)));
								}
								return rv;
							},result);
						}
						return copy;
					}

					return function(document) {
						var children = document.children.map(function(child) {
							return convert(child,0);
						}).reduce(function(rv,child,index,children) {
							rv.push(child);
							if (index+1 != children.length) {
								rv.push({
									type: "text",
									data: "\n"
								})
							}
							return rv;
						}, []);
						return {
							type: "document",
							children: children
						}
					}
				},
				element: function(document) {
					var elements = document.children.filter(source.Node.isElement);
					if (elements.length != 1) throw new Error("Document has " + elements.length + " root elements.");
					return elements[0];
				}
			}
		};

		$export(rv);
	}
//@ts-ignore
)($platform,$api,$context,$loader,$export);
