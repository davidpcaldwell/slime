//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * @deprecated An older API for processing HTML and XML documents. Superseded by the superior {@link slime.runtime.document} APIs.
 *
 * Provides a simple JavaScript-centric API that is analogous to, but not conformant with, the Document Object Model.
 */
namespace slime.old.document {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			return script();
		//@ts-ignore
		})(fifty);
	}

	/**
	 * A qualified name, including an XML namespace and a name within that namespace.
	 */
	export interface Name {
		/**
		 * A URI specifying an XML namespace.
		 */
		namespace?: string

		/**
		 * The name within the given namespace.
		 */
		name: string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.Node = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	/**
	 * A node in a document.
	 */
	export interface Node {
		/**
		 * Converts a node to a string. The current implementation outputs ordinary XML unless the document is detected to be XHTML;
		 * if it is XHTML, the implementation adds some special XHTML handling; it does not use self-closing tags for some empty
		 * elements and adds whitespace in self-closing tags per the XHTML 1.0 compatibility guidelines.
		 *
		 * @param parameters An object that specifies various parameters about how to serialize a node. The parameters are currently
		 * internal and undocumented.
		 * @returns
		 */
		serialize: (parameters?: object) => string
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const module = test.subject;

			fifty.tests.Node.serialize = function() {
				const test = function(b: boolean) {
					fifty.verify(b).is(true);
				};

				var buildTestDocument = function(p?: any) {
					var document = new module.Document();

					var element = function(tag) {
						if (!p || !p.namespace) {
							return new module.Element({
								type: {
									name: tag
								}
							});
						} else {
							return new module.Element({
								type: {
									namespace: p.namespace,
									name: tag
								}
							});
						}
					}

					var html = element("html");
					document.children.push(html);
					var head = element("head");
					var link = element("link");
					html.children.push(head);
					head.children.push(link);
					var body = element("body");
					var div = element("div");
					body.children.push(div);
					if (p && p.namespace == "http://www.w3.org/1999/xhtml") {
						body.children.push(new module.Element({
							type: {
								namespace: "http://www.inonit.com/test",
								name: "nstest"
							}
						}));
					}
					html.children.push(body);
					return document;
				};

				var xml = buildTestDocument();
				test(xml.serialize() == "<html><head><link/></head><body><div/></body></html>");
				var xhtml = buildTestDocument({ namespace: "http://www.w3.org/1999/xhtml" });
				test(xhtml.serialize() == "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head><link /></head><body><div></div><nstest xmlns=\"http://www.inonit.com/test\" /></body></html>");
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * A node that can have children.
	 */
	export interface Parent extends Node {
		/**
		 * The children of this node.
		 */
		children: Node[]

		/**
		 * Searches the descendants of this node for a single matching node.
		 * @param search The algorithm to use.
		 * @returns The single node found by the search, or `null` if no nodes were found. If multiple nodes were found,
		 * throws an error.
		 */
		identify: (search: parent.Search) => Node

		/**
		 * Returns a single child node of this node matching the given filter.
		 * @param filter A filtering function.
		 * @returns The single child of this node matching the given filter, or `null` if no child matches the filter. Throws an
		 * error if multiple children match.
		 */
		child: (filter: parent.Filter) => Node
	}

	export namespace parent {
		/**
		 * A function that specifies an arbitrary criterion about nodes.
		 */
		export type Filter = slime.$api.fp.Predicate<Node>

		/**
		 * An algorithm used to find nodes. Can be fully-specified by an interface containing a filter (to include or exclude nodes)
		 * and a `descendants` property (to decide whether a particular node's children should be searched).
		 *
		 * A search can also be specified via a single function, in which case the function is interpreted as the `filter` property
		 * of the search and descendants of all nodes are searched.
		 */
		export type Search = {
			/**
			 * A function that specifies which nodes should be included in the results of the search.
			 */
			filter: Filter

			/**
			 * A function that specifies whether the descendants of a particular node should be searched.
			 */
			descendants: slime.$api.fp.Predicate<Node>
		} | slime.$api.fp.Predicate<Node>
	}

	/**
	 * A node representing a comment.
	 */
	export interface Comment extends Node {
		/**
		 * Contains data about the comment.
		 */
		comment: {
			/**
			 * The text of the comment.
			 */
			data: string
		}
	}

	/**
	 * A node that contains character data.
	 */
	export interface Characters extends Node {
		/**
		 * Returns the character data represented by this node.
		 */
		getString: () => string
	}

	/**
	 * A node that contains text.
	 */
	export interface Text extends Characters {
		/**
		 * Contains data about the text node.
		 */
		text: {
			/**
			 * The character data represented by this node.
			 */
			data: string
		}
	}

	/**
	 * A node that is a CDATA section.
	 */
	export interface Cdata extends Characters {
		/**
		 * Contains data about the CDATA section.
		 */
		cdata: {
			/**
			 * The character data represented by this node.
			 */
			data: string
		}
	}

	/**
	 * A node representing an element.
	 */
	export interface Element extends Parent {
		/**
		 * Contains element-specific data.
		 */
		element: {
			type: Name

			attributes: element.Attribute[] & {
				/**
				 * Returns the value of a named attribute.
				 *
				 * @param name An attribute name.
				 * @returns The value of the given attribute, or `null` if the attribute is not present.
				 */
				get: (name: element.attribute.Name) => string

				/**
				 * Sets the value of a named attribute.
				 *
				 * @param name An attribute name.
				 * @param value A value to which to set the attribute, or `null` to remove it.
				 */
				set: (name: element.attribute.Name, value: string) => void
			}
		}
	}

	export namespace element {
		/**
		 * A named attribute and its value; corresponds to a specific attribute declaration in a document.
		 */
		export interface Attribute extends Name {
			//	TODO	nullable? undefined?
			/**
			 * The attribute's value.
			 */
			value: string
		}

		export namespace attribute {
			/**
			 * An attribute name to use in an operation. Is either a {@link document.Name | Name} or a `string`. If it is a
			 * `string`, it is interpreted as a name that is not in a namespace.
			 */
			export type Name = document.Name | string
		}
	}

	/**
	 * A node representing a document type declaration.
	 */
	export interface Doctype extends Node {
		/**
		 * Contains properties information about the document type declaration. See the [DOM 3
		 * specification](http://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#ID-412266927) for additional
		 * specification detail.
		 */
		doctype: {
			/**
			 * The name given in the DOCTYPE declaration: that is, the name immediately following the DOCTYPE keyword.
			 */
			name: string

			/**
			 * The public identifier given in the DOCTYPE declaration: for example, `-//W3C//DTD XHTML 1.0 Transitional//EN`.
			 */
			systemId: string

			/**
			 * The public identifier given in the DOCTYPE declaration: for example,
			 * `http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd`.
			 */
			publicId: string
		}
	}

	/**
	 * A top-level node that contains other nodes and represents a well-formed document.
	 */
	export interface Document extends Parent {
		/**
		 * Contains methods that pertain to the document.
		 */
		document: {
			/**
			 * Returns the *document element* of the document.
			 */
			getElement: () => Element

			/**
			 * Returns the document type of this document.
			 */
			getType: () => Doctype
		}
	}

	export interface Exports {
		/**
		 * Creates a new, empty document object.
		 */
		Document: new (p?: {
			children?: slime.old.document.Node[]
		}) => Document
	}

	export interface Exports {
		Element: new (p: {
			/**
			 * The *type* of this element.
			 */
			type: document.Name

			namespaces?: any

			/**
			 * Attributes to use when initializing this element.
			 */
			attributes?: element.Attribute[]

			children?: Node[]
		}) => Element
	}

	export interface Exports {
		/**
		 * Creates a {@link slime.old.document.parent.Filter} based on the argument given.
		 *
		 * @param p An object describing the filter.
		 */
		filter: {
			/**
			 * Matches elements with the given local name.
			 */
			(p: { elements: string }): parent.Filter
			(p: { attribute: any, value?: any }): parent.Filter
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = test.subject;

			fifty.tests.Filter = function() {
				var elements = [
					new module.Element({
						type: { name: "a" },
						attributes: [{ name: "a", value: "a" }]
					}),
					new module.Element({
						type: { name: "a" },
						attributes: [{ name: "b", value: "c" },{ name: "a", value: "b" }]
					}),
					new module.Element({
						type: { name: "a" },
						attributes: [{ name: "b", value: "d" }]
					})
				];
				var document = new module.Document({
					children: [
						new module.Element({
							type: { name: "root" },
							children: elements
						})
					]
				});
				var root = document.document.getElement();
				(function() {
					var filtered = root.children.filter(module.filter({ attribute: "a" }));
					verify(filtered).length.is(2);
					verify(filtered)[0].is(elements[0]);
					verify(filtered)[1].is(elements[1]);
				})();
				(function() {
					var filtered = root.children.filter(module.filter({ attribute: "a", value: "a" }));
					verify(filtered).length.is(1);
					verify(filtered)[0].is(elements[0]);
				})();
				(function() {
					var filtered = root.children.filter(module.filter({ attribute: "b", value: "d" }));
					verify(filtered).length.is(1);
					verify(filtered)[0].is(elements[2]);
				})();
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Text: any
		Cdata: any
		Comment: any
		Doctype: any
		ProcessingInstruction: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Node);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<void,Exports>
}
