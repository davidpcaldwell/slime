//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document.source {
	export type ParseEvents = {
		startTag: string
		startElement: string
		endElement: string
	}

	export interface Export {
		parse: (p: {
			string: string
			events?: slime.$api.events.Handler<ParseEvents>
		}) => Document

		fragment: (p: {
			string: string
			events?: slime.$api.events.Handler<ParseEvents>
		}) => Fragment

		serialize: {
			(p: {
				document: Document
			}): string
			(p: {
				fragment: Fragment
			}): string
		}
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
		selfClosing: boolean
		endTag: string
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

		export type Parser<T extends Parent> = (
			state: State<T>,
			events: slime.$api.Events<ParseEvents>,
			finished: (state: State<T>) => boolean
		) => State<T>
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var api: Export = fifty.$loader.module("source.js");

			fifty.tests.happy = function() {
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
			}

			fifty.tests.attributes = Object.assign(
				function() {
					run(fifty.tests.attributes.singlequoted);
					run(fifty.tests.attributes.unquoted);
				},
				{
					singlequoted: function(p) {
						var html = "<e a='b'></e>";
						var fragment = api.fragment({ string: html });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("'");
						fifty.verify(element).attributes[0].value.is("b");
						var serialized = api.serialize({ fragment: fragment });
						fifty.verify(serialized).is(html);
					},
					unquoted: function(p) {
						var html = "<e a=b></e>";
						var fragment = api.fragment({ string: html });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("");
						fifty.verify(element).attributes[0].value.is("b");
						var serialized = api.serialize({ fragment: fragment });
						fifty.verify(serialized).is(html);
					}
				}
			);

			fifty.tests.selfClosing = function() {
				var html = "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=ISO-8859-1\" />"
				var fragment = api.fragment({
					string: html,
					events: {
						startTag: function(e) {
							if (fifty.global.window) {
								fifty.global.window["console"].log(e.detail);
							}
						}
					}
				});
				fifty.verify(fragment).children[0].type.is("element");
				var serialized = api.serialize({
					fragment: fragment
				});
				fifty.verify(serialized).is(html);
			}

			fifty.tests.voidElements = function() {
				var html = "<input type=\"hidden\" value=\"foo\"><input type=\"hidden\" value=\"bar\">";
				var fragment = api.fragment({
					string: html
				});
				fifty.verify(fragment).children.length.is(2);
				var serialized = api.serialize({
					fragment: fragment
				});
				fifty.verify(serialized).is(html);
			}

			fifty.tests.caseInsensitiveElement = function() {
				var html = "<div>foo</DIV>";

				var fragment = api.fragment({
					string: html
				});
				fifty.verify(fragment).children.length.is(1);
				var element: Element = fragment.children[0] as Element;
				fifty.verify(element).type.is("element");
				fifty.verify(element).children[0].type.is("text");
				var serialized = api.serialize({
					fragment: fragment
				});
				fifty.verify(serialized).is(html);
				debugger;
			}

			fifty.tests.multilineStartTag = function() {
				var html = (
`
<div
	id="foo"
>
	bar
</div>
`
				);
				var fragment = api.fragment({ string: html });
				var serialized = api.serialize({ fragment: fragment });
				fifty.verify(serialized).is(html);
			}

			fifty.tests.suite = function() {
				run(fifty.tests.happy);
				run(fifty.tests.attributes);
				run(fifty.tests.selfClosing);
				run(fifty.tests.voidElements);
				run(fifty.tests.multilineStartTag);
			}
		}
	//@ts-ignore
	)(fifty);
}
