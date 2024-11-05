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
		namespace: string

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
		serialize: (parameters: object) => string
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

	export interface Exports {
		filter: any

		Text: any
		Element: any
		Document: any
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
