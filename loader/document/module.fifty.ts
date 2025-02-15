//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a pure JavaScript parser/serializer for HTML and XML documents that, unlike a standard DOM HTML parser, can provide
 * accurate bidirectional translation from markup to its internal representation using the module's provided {@link slime.Codec}s:
 * {@link slime.runtime.document.exports.Document | `Document.codec.string`} and
 * {@link slime.runtime.document.Exports | `Fragment.codec.string`}.
 *
 * Note that the "objects" returned by this parser are "dumb" objects, and are not really designed to be used by the application.
 * Rather, the application should use the functional interfaces provided for operating on these objects. For example:
 *
 * * when a document contains a text node with an escaped character in it, the escaped character is preserved as-is in the `data` property
 *   of that node (even though the DOM `data` property has different semantics.)
 * * In a list of attributes for an element, if there is whitespace after the last attribute, a phantom "attribute" will be created
 *   that consists only of the whitespace.
 *
 * Generally speaking, the functional interfaces provide APIs that clean up these "dumb" objects and return application-level
 * information about them.
 */
namespace slime.runtime.document {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			var isBrowser = Boolean(fifty.global.window);
			var isJsh = Boolean(fifty.global.jsh);
			var api: Exports = script({
				$slime: (isJsh) ? fifty.global.jsh.unit.$slime : void(0)
			});
			return api;
		//@ts-ignore
		})(fifty);
	}

	export interface Context {
		/**
		 * If present, its `java` property allows the use of the older JSoup-based Java document parsing.
		 */
		$slime?: Pick<old.Context["$slime"],"java">
	}

	/**
	 * @experimental
	 */
	export interface Settings {
		xml?: boolean
	}

	export namespace exports {
		export interface Document {
			codec: {
				string: slime.Codec<slime.runtime.document.Document,string>
			}
			from: {
				string: (settings: Settings) => (string: string) => slime.runtime.document.Document
			}
			removeWhitespaceTextNodes: slime.$api.fp.Transform<slime.runtime.document.Document>
			prettify: (p: { indent: string }) => slime.$api.fp.Transform<slime.runtime.document.Document>
			element: (p: slime.runtime.document.Document) => slime.runtime.document.Element
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var subject = test.subject;

				fifty.tests.Document = function() {
					var before = "<root><child/><child/><child/></root>";
					var document = subject.Document.codec.string.decode(before);
					var pretty = subject.Document.prettify({
						indent: "\t"
					})(document);
					var after = subject.Document.codec.string.encode(pretty);
					fifty.verify(
						after == [
							"<root>",
							"\t<child/>",
							"\t<child/>",
							"\t<child/>",
							"</root>"
						].join("\n"),
						"correct"
					).is(true);
					debugger;
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		load: old.Exports["load"]
	}

	export namespace exports {
		export interface Node {
			isElementNamed: (name: string) => slime.$api.fp.TypePredicate<document.Node,document.Element>
		}
	}

	export interface Exports {
		Node: exports.Node
	}

	export interface Exports {
		Parent: {
			/**
			 * Creates a {@link slime.$api.fp.Stream | Stream} of the descendants of this parent node. In all cases -
			 * {@link slime.runtime.document.Document | Document}s, {@link slime.runtime.document.Element | Element}s, and even
			 * {@link slime.runtime.document.Fragment | Fragment}s, this first {@link slime.runtime.document.Node | Node} in the
			 * returned stream will be the parent node provided as an argument.
			 * @param p A parent node.
			 * @returns A stream containing the given parent node and its descendants. Will not be empty, because it will always
			 * contain the given node.
			 */
			nodes: (p: Parent) => slime.$api.fp.Stream<Node>

			child: {
				index: {
					simple: (index: number) => (parent: Parent) => Node
				}
			}

			content: {
				text: {
					set: (p: {
						parent: Parent
						data: string
					}) => void
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, window } = fifty.global;
			const subject = test.subject;

			fifty.tests.Parent = fifty.test.Parent();

			fifty.tests.Parent.nodes = fifty.test.Parent();

			fifty.tests.Parent.nodes.one = function() {
				var document = subject.Document.codec.string.decode("<root/>");
				var nodes = $api.fp.result(
					subject.Parent.nodes(document),
					$api.fp.Stream.collect
				);
				verify(nodes).length.is(2);
			}

			fifty.tests.Parent.nodes.two = function() {
				var document = subject.Document.codec.string.decode("<root><a/><b><b2/></b></root>");
				var nodes = $api.fp.result(
					subject.Parent.nodes(document),
					$api.fp.Stream.collect
				);

				var isElement = function(name: string) {
					return function(node: slime.runtime.document.Node) {
						if (subject.Node.isElement(node)) {
							return node.name == name;
						}
					}
				}
				verify(nodes).length.is(5);
				verify(nodes)[0].type.is("document");
				verify(nodes)[1].evaluate(isElement("root")).is(true);
				verify(nodes)[2].evaluate(isElement("a")).is(true);
				verify(nodes)[3].evaluate(isElement("b")).is(true);
				verify(nodes)[4].evaluate(isElement("b2")).is(true);

				var elements = $api.fp.result(
					subject.Parent.nodes(document),
					$api.fp.pipe(
						$api.fp.Stream.filter(subject.Node.isElement),
						$api.fp.Stream.collect
					)
				);
				verify(elements).length.is(4);
				verify(elements)[0].evaluate(isElement("root")).is(true);
				verify(elements)[1].evaluate(isElement("a")).is(true);
				verify(elements)[2].evaluate(isElement("b")).is(true);
				verify(elements)[3].evaluate(isElement("b2")).is(true);
			}

			fifty.tests.Parent.child = fifty.test.Parent();
			fifty.tests.Parent.child.index = function() {
				var empty = $api.fp.now("<root/>", subject.Document.codec.string.decode, subject.Document.element);
				var notEmpty = $api.fp.now("<root><a/><b><b2/></b></root>", subject.Document.codec.string.decode, subject.Document.element);
				verify(empty).evaluate(subject.Parent.child.index.simple(0)).threw.type(Error);
				verify(notEmpty).evaluate(subject.Parent.child.index.simple(0)).threw.nothing();
				verify(notEmpty).evaluate(subject.Parent.child.index.simple(0)).type.is("element");
				verify(notEmpty).evaluate(subject.Parent.child.index.simple(0)).evaluate(function(node) { if (!subject.Node.isElement(node)) throw new Error(); return node; }).evaluate(function(e) { return e.name; }).is("a");
			}

			fifty.tests.Parent.content = fifty.test.Parent();
			fifty.tests.Parent.content.text = fifty.test.Parent();
			fifty.tests.Parent.content.text.set = function() {
				var document = subject.Document.codec.string.decode("<root><a/><b><b2/></b></root>");
				var root = $api.fp.now(document, subject.Document.element);
				subject.Parent.content.text.set({ parent: root, data: "foo" });
				var after = subject.Document.codec.string.encode(document);
				verify(after).is("<root>foo</root>");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Document: exports.Document

		Fragment: {
			codec: {
				string: slime.Codec<slime.runtime.document.Fragment,string>
			}
		}
	}

	export namespace exports {
		export interface Element {
			isName: (name: string) => (element: document.Element) => boolean
			getAttribute: (name: string) => (element: document.Element) => slime.$api.fp.Maybe<string>
			from: element.From
		}
	}

	export interface Exports {
		Element: exports.Element
	}

	export type Script = slime.loader.Script<Context | void,Exports>
}

/**
 * The SLIME document parser is a parser and serializer that handles HTML (and XHTML/XML) documents, converting them to a
 * tree structure (which is somewhat analogous to a DOM tree).
 *
 * The produced tree conforms to the HTML DOM specification, so (for example) whitespace may be altered when parsing.
 */
namespace slime.runtime.document.old {
	export interface Context {
		/**
		 * Only used when using the JSoup implementation.
		 */
		$slime?: slime.jsh.plugin.$slime
	}

	export interface Exports {
		load: any
	}

	export type Script = slime.loader.Script<Context,Exports>;

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var load: Script = fifty.$loader.script("module.js");

			var isBrowser = Boolean(fifty.global.window);
			var isJsh = Boolean(fifty.global.jsh);
			var api: Exports = load({
				$slime: (isJsh) ? fifty.global.jsh.unit.$slime : void(0)
			});
			return api;
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var api = test.subject;

			function testsFor1(page,verify,withComments) {
				var offset = (withComments) ? 1 : 0
				verify(page).children.length.is(2 + offset);
				verify(page).children.get(0 + offset).doctype.is.type("object");
				verify(page).children.get(0 + offset).doctype.name.is.type("string");
				verify(page).children.get(0 + offset).doctype.name.is("html");

				verify(page).children.get(1 + offset).element.is.type("object");
				verify(page).document.element.is.type("object");
				verify(page).document.element.element.name.is("html");

				verify(page).document.element.element.attributes.get("class").is("class1");
				verify(page).document.element.element.attributes.get("foo").is(null);
			}

			fifty.tests.old = function() {
				fifty.run(function files() {
					//	This is not really a test of this module
					var resource = fifty.$loader.get("test/data/1.html");
					fifty.verify(resource).is.type("object");
					var missing = fifty.$loader.get("test/data/foo.html");
					fifty.verify(missing).is.type("null");
				});

				fifty.run(function parse() {
					var page = api.load({
						loader: fifty.$loader,
						path: "test/data/1.html"
					});
					testsFor1(page,fifty.verify,true);
				});

				fifty.run(function codec() {
					var page = api.load({
						loader: fifty.$loader,
						path: "test/data/1.html"
					});
					var string: string = page.serialize();
					var reparsed = api.load({
						string: string
					});
					testsFor1(reparsed,fifty.verify,Boolean(fifty.global.jsh));
					//	TODO	below does not work in JSoup 1.12.1, which messes up some pieces of whitespace
					//	TODO	below does not work in browser, either
					//	See https://stackoverflow.com/questions/57394776/why-does-domparser-alter-whitespace
					if (false) {
						fifty.verify(string).is(fifty.$loader.get("test/data/1.html").read(String));
					}
				});
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Document);

				fifty.load("source.fifty.ts");

				fifty.run(fifty.tests.old);
			}
		}
	//@ts-ignore
	)(fifty);
}
