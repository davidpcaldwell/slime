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
		var NodeList = function() {
			var array = [];

			this.get = function(index) {
				return array[index];
			}

			Object.defineProperty(this, "length", {
				get: function() {
					return array.length;
				}
			});

			this.add = function(node) {
				array.push(node);
			};

			this.map = function(f,target) {
				return array.map(f,target);
			}
		}

		var Parent = function() {
			var list = new NodeList();

			Object.defineProperty(this, "children", {
				get: function() {
					return list;
				}
			});
		}

		var Document = function() {
			this.children = void(0);

			Parent.call(this);

			this.serialize = function() {
				return this.children.map(function(child) {
					return child.serialize();
				}).join("");
			}
		};

		var Doctype = function() {
			this.name = void(0);

			this.serialize = function() {
				return "<!DOCTYPE " + this.name + ">";
			}
		};

		var Position = function(string) {
			var index = 0;

			this.startsWith = function(prefix) {
				return string.substring(index,index+prefix.length) == prefix;
			};

			this.skip = function(prefix) {
				if (!this.startsWith(prefix)) throw new Error();
				index += prefix.length;
			};

			this.consume = function() {
				var rv = string.substring(index,index+1);
				index++;
				return rv;
			};

			this.more = function() {
				return index < string.length;
			};

			this.debug = new function() {
				this.rest = function() {
					return string.substring(index);
				};

				this.finish = function() {
					index = string.length;
				};
			}
		}

		var states = new function() {
			this.document = function(p) {
				var rv = new Document();
				var position = new Position(p.string);
				while(position.more()) {
					if (position.startsWith(states.doctype.prefix)) {
						rv.children.add(states.doctype({ position: position }));
						position.debug.finish();
					} else {
						throw new Error("Unknown state: rest=" + position.debug.rest())
					}
				}
				return rv;
			};

			this.doctype = Object.assign(
				function(p) {
					p.position.skip(states.doctype.prefix);
					//	does not deal with publicId, systemId
					var rv = new Doctype();
					rv.name = states.doctype._name({ position: p.position });
					return rv;
				},
				{
					prefix: "<!DOCTYPE ",
					_name: function(p) {
						var rv = "";
						while(!p.position.startsWith(">")) {
							rv += p.position.consume();
						}
						p.position.skip(">");
						return rv;
					}
				}
			)
		}

		/**
		 *
		 * @param { slime.runtime.document.source.internal.Position } position
		 * @returns { string }
		 */
		function remaining(position) {
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

		/** @type { (node: slime.runtime.document.source.Node) => node is slime.runtime.document.source.Comment } */
		var isComment = function(node) {
			return node.type == "comment";
		}

		var isCommentStart = $api.Function.pipe(
			remaining,
			startsWith("<!--")
		)

		/**
		 *
		 * @param { slime.runtime.document.source.internal.State } state
		 * @returns { slime.runtime.document.source.internal.State }
		 */
		var parseComment = function(state) {
			var left = remaining(state.position);
			var end = left.substring("<!--".length).indexOf("-->");
			if (end == -1) throw new Error();
			//	TODO	switch to immutable
			var comment = {
				type: "comment",
				data: left.substring("<!--".length, "<!--".length + end)
			};
			return {
				parsed: { children: state.parsed.children.concat([comment]) },
				position: {
					document: state.position.document,
					offset: state.position.offset + end + "-->".length
				}
			}
		}

		/** @returns { slime.runtime.document.source.internal.Parser } */
		var Parser = function(configuration) {
			return function recurse(state) {
				if (state.position.offset == state.position.document.length) {
					return state.parsed;
				}

				if (isCommentStart(state.position)) return recurse(parseComment(state));

				//	skip to end of document
				/** @type { slime.runtime.document.source.internal.Unparsed } */
				var rest = {
					type: "unparsed",
					string: remaining(state.position)
				}
				return recurse({
					parsed: {
						children: state.parsed.children.concat([
							rest
						])
					},
					position: {
						document: state.position.document,
						offset: state.position.document.length
					}
				});
			};
		}

		var Serializer = function(configuration) {
			return function(node) {
				if (isComment(node)) {
					return "<!--" + node.data + "-->";
				}
				return "";
			}
		}

		$export({
			parse: function(input) {
				return Parser()({
					parsed: {
						children: []
					},
					position: {
						document: input.string,
						offset: 0
					}
				});
			},
			serialize: function(output) {
				var serialize = Serializer();
				return output.document.children.map(serialize).join("");
			}
		})
	}
//@ts-ignore
)($api,$export);
