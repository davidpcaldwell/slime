//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document.source {
	export interface Export {
		parse: (p: {
			string: string
		}) => Document

		fragment: (p: {
			string: string
		}) => Fragment

		serialize: (p: {
			document: Document
		}) => string
	}

	export interface Node {
		type: string
	}

	export interface Parent extends Node {
		children: Node[]
	}

	export interface Comment extends Node {
		type: "comment"
		data: string
	}

	export interface Text extends Node {
		type: "text"
		data: string
	}

	export interface Doctype extends Node {
		type: "doctype"
		before: string
		name: string
		after: string
	}

	export interface Element extends Parent {
		type: "element"
		name: string
		attributes: Attribute[]
	}

	export interface Attribute {
		//	TODO	may be whitespace before equals
		//	TODO	may be whitespace after equals
		whitespace: string
		name: string
		quote: string
		value: string
	}

	export interface Document extends Parent {
		type: "document"
	}

	export interface Fragment extends Parent {
		type: "fragment"
	}

	export namespace internal {
		export interface Position {
			document: string
			offset: number
		}

		export interface State<T extends Parent> {
			parsed: T
			position: Position
		}

		//	temporary, until parser is complete
		export interface Unparsed extends Node {
			string: string
		}

		export type Step = <T extends Parent>(state: State<T>, finished?: (state: State<T>) => boolean) => State<T>

		export type Parser = <T extends Parent>(state: State<T>, finished: (state: State<T>) => boolean) => State<T>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var api: Export = fifty.$loader.module("source.js");

			fifty.tests.attributes = Object.assign(
				function() {
					run(fifty.tests.attributes.singlequoted);
					run(fifty.tests.attributes.unquoted);
				},
				{
					singlequoted: function(p) {
						var fragment = api.fragment({ string: "<e a='b'></e>" });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("'");
						fifty.verify(element).attributes[0].value.is("b");
					},
					unquoted: function(p) {
						var fragment = api.fragment({ string: "<e a=b></e>" });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("");
						fifty.verify(element).attributes[0].value.is("b");
					}
				}
			);

			fifty.tests.suite = function() {
				var input = fifty.$loader.get("test/data/1.html").read(String);
				var page = api.parse({
					string: input
				});
				//	license header
				fifty.verify(page).children[0].type.is("comment");
				fifty.verify(page).children[1].type.is("text");
				var text: Text = page.children[1] as Text;
				//	TODO	below does not render correctly on Fifty browser test runner or probably jrunscript either
				fifty.verify(text).data.is("\n");
				var doctype = page.children[2] as Doctype;
				fifty.verify(doctype).type.is("doctype");
				fifty.verify(doctype).name.is("html");
				var text2: Text = page.children[3] as Text;
				fifty.verify(text2).data.is("\n");
				var serialized = api.serialize({
					document: page
				});
				fifty.verify(serialized).is(input);

				run(fifty.tests.attributes);
			}
		}
	//@ts-ignore
	)(fifty);
}
