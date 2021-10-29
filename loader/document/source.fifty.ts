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

		Node: {
			isComment: (node: slime.runtime.document.Node) => node is slime.runtime.document.Comment
			isText: (node: slime.runtime.document.Node) => node is slime.runtime.document.Text
			isDoctype: (node: slime.runtime.document.Node) => node is slime.runtime.document.Doctype
			isDocument: (node: slime.runtime.document.Node) => node is slime.runtime.document.Document
			isElement: (node: slime.runtime.document.Node) => node is slime.runtime.document.Element
			isFragment: (node: slime.runtime.document.Node) => node is slime.runtime.document.Fragment
		}
	}

	export namespace internal {
		export namespace test {
			export const subject: Export = (function(fifty: fifty.test.kit) {
				return fifty.$loader.module("source.js");
			//@ts-ignore
			})(fifty)
		}
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
					fifty.run(fifty.tests.attributes.singlequoted);
					fifty.run(fifty.tests.attributes.unquoted);
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

			fifty.tests.emptyAttribute = function() {
				var html = "<div id=\"\"></div>"
				var fragment = api.fragment({ string: html });
				var serialized = api.serialize({ fragment: fragment });
				fifty.verify(serialized).is(html);
				debugger;
			}

			fifty.tests.optionalTags = function() {
			};

			fifty.tests.optionalTags.tr = function() {
				var html = "<table> <tr> <td>foo</td> </table>";
				var fragment = api.fragment({ string: html });
				var serialized = api.serialize({ fragment: fragment });
				fifty.verify(serialized).is(html);
				debugger;
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.happy);
				fifty.run(fifty.tests.attributes);
				fifty.run(fifty.tests.selfClosing);
				fifty.run(fifty.tests.voidElements);
				fifty.run(fifty.tests.multilineStartTag);
				fifty.run(fifty.tests.emptyAttribute);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			//	TODO	possibly add to Fifty?
			var console = function(...args: any[]) {
				if (fifty.global.jsh) {
					Array.prototype.slice.call(arguments).forEach(function(argument) {
						fifty.global.jsh.shell.console(argument);
					})
				}
				if (fifty.global.window) window.console.log.apply(null, arguments);
			}

			fifty.tests.fidelity = function(input: string) {
				var html = internal.test.subject;

				var document = html.parse({
					string: input,
					events: (function() {
						var stack = [];
						/**
						 * @type { slime.$api.events.Handler<slime.runtime.document.source.ParseEvents> }
						 */
						var rv = {
							startElement: function(e) {
								console(e.detail);
								stack.push(e.detail);
								console("Stack", stack.join(" "));
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

				var serialized = html.serialize({
					document: document
				});

				console("Serialized.");

				var match = 1;
				while( (input.substring(0,match) == serialized.substring(0,match)) && match < input.length) {
					match++;
				}

				if (match < input.length) {
					console("page", input.substring(match));
					console("serialized", serialized.substring(match));
				}

				fifty.verify(input == serialized, "page == serialized").is(true);
			}
		}
	//@ts-ignore
	)(fifty);

}
