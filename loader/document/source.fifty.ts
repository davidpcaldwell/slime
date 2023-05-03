//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document {
	export interface Exports {
		Node: {
			isComment: (node: slime.runtime.document.Node) => node is slime.runtime.document.Comment
			isText: (node: slime.runtime.document.Node) => node is slime.runtime.document.Text
			isDoctype: (node: slime.runtime.document.Node) => node is slime.runtime.document.Doctype
			isDocument: (node: slime.runtime.document.Node) => node is slime.runtime.document.Document
			isElement: (node: slime.runtime.document.Node) => node is slime.runtime.document.Element
			isFragment: (node: slime.runtime.document.Node) => node is slime.runtime.document.Fragment
			isParent: (node: Node) => node is Parent
			isString: (node: Node) => node is String
		}
	}
}

namespace slime.runtime.document.internal.source {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export type ParseEvents = {
		startTag: string
		startElement: string
		endElement: string
	}

	export interface Exports {
		debug: {
			fidelity: (p: {
				markup: string
				events: slime.$api.event.Handlers<{ console: string }>
			}) => boolean
		}

		parse: {
			document: (p: {
				settings: Settings
				string: string
				events?: slime.$api.event.Handlers<ParseEvents>
			}) => Document

			fragment: (p: {
				settings: Settings
				string: string
				events?: slime.$api.event.Handlers<ParseEvents>
			}) => Fragment
		}

		serialize: {
			document: (p: {
				settings: Settings
				document: Document
			}) => string

			fragment: (p: {
				settings: Settings
				fragment: Fragment
			}) => string
		}

		Node: slime.runtime.document.Exports["Node"]

		/**
		 * Methods used internally, visible for testing.
		 */
		internal: internal.Export
	}

	export type Script = slime.loader.Script<void,Exports>

	export namespace internal {
		export namespace test {
			export const subject: slime.runtime.document.internal.source.Exports = (function(fifty: fifty.test.Kit) {
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

	export namespace internal {
		export interface Export {
			parseStartTag: (string: string) => {
				tag: string
				attributes: string
				selfclose: boolean
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			var api: Exports = fifty.$loader.module("source.js");

			var settings: Settings = {};

			fifty.tests.happy = function() {
				var input = fifty.$loader.get("test/data/1.html").read(String);
				var page = api.parse.document({
					settings: settings,
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
				var serialized = api.serialize.document({
					settings: settings,
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
						var fragment = api.parse.fragment({ settings: settings, string: html });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("'");
						fifty.verify(element).attributes[0].value.is("b");
						var serialized = api.serialize.fragment({ settings: settings, fragment: fragment });
						fifty.verify(serialized).is(html);
					},
					unquoted: function(p) {
						var html = "<e a=b></e>";
						var fragment = api.parse.fragment({ settings: settings, string: html });
						fifty.verify(fragment).children[0].type.is("element");
						var element: Element = fragment.children[0] as Element;
						fifty.verify(element).attributes[0].name.is("a");
						fifty.verify(element).attributes[0].quote.is("");
						fifty.verify(element).attributes[0].value.is("b");
						var serialized = api.serialize.fragment({ settings: settings, fragment: fragment });
						fifty.verify(serialized).is(html);
					}
				}
			);

			fifty.tests.selfClosing = function() {
				var html = "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=ISO-8859-1\" />"
				var fragment = api.parse.fragment({
					settings: settings,
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
				var serialized = api.serialize.fragment({
					settings: settings,
					fragment: fragment
				});
				fifty.verify(serialized).is(html);
			}

			fifty.tests.voidElements = function() {
				var html = "<input type=\"hidden\" value=\"foo\"><input type=\"hidden\" value=\"bar\">";
				var fragment = api.parse.fragment({
					settings: settings,
					string: html
				});
				fifty.verify(fragment).children.length.is(2);
				var serialized = api.serialize.fragment({
					settings: settings,
					fragment: fragment
				});
				fifty.verify(serialized).is(html);
			}

			fifty.tests.caseInsensitiveElement = function() {
				var html = "<div>foo</DIV>";

				var fragment = api.parse.fragment({
					settings: settings,
					string: html
				});
				fifty.verify(fragment).children.length.is(1);
				var element: Element = fragment.children[0] as Element;
				fifty.verify(element).type.is("element");
				fifty.verify(element).children[0].type.is("text");
				var serialized = api.serialize.fragment({
					settings: settings,
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
				var fragment = api.parse.fragment({ settings: settings, string: html });
				var serialized = api.serialize.fragment({ settings: settings, fragment: fragment });
				fifty.verify(serialized).is(html);
			}

			fifty.tests.emptyAttribute = function() {
				var html = "<div id=\"\"></div>"
				var fragment = api.parse.fragment({ settings: settings, string: html });
				var serialized = api.serialize.fragment({ settings: settings, fragment: fragment });
				fifty.verify(serialized).is(html);
				debugger;
			}

			fifty.tests.optionalTags = function() {
				fifty.run(fifty.tests.optionalTags.tr);
			};

			fifty.tests.optionalTags.tr = function() {
				var html = "<table> <tr> <td>foo</td> </table>";
				var fragment = api.parse.fragment({ settings: settings, string: html });
				var serialized = api.serialize.fragment({ settings: settings, fragment: fragment });
				fifty.verify(serialized).is(html);
			}

			fifty.tests.xml = fifty.test.Parent();

			fifty.tests.xml.prolog = function() {
				var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><root/>";
				var document = api.parse.document({ settings: settings, string: xml });
				var serialized = api.serialize.document({ settings: settings, document: document });
				fifty.verify(serialized).is(xml);
			}

			fifty.tests.xml.cdata = function() {
				var xml = "<root><![CDATA[<data!/>]]></root>";
				var document = api.parse.document({ settings: settings, string: xml });
				fifty.verify(document).children.length.is(1);
				fifty.verify(document).children[0].type.is("element");
				var root = document.children[0] as slime.runtime.document.Element;
				fifty.verify(root).children[0].type.is("cdata");
				var cdata = root.children[0] as slime.runtime.document.xml.Cdata;
				fifty.verify(cdata).data.is("<data!/>");
				var serialized = api.serialize.document({ settings: settings, document: document });
				fifty.verify(serialized).is(xml);
			}

			fifty.tests.emptyTagsParsedCorrectly = function() {
				var xml = "<root><foo bar=\"\"/><baz/></root>";
				var document = api.parse.document({ settings: settings, string: xml });
				fifty.verify(document).children[0].type.is("element");
				var root = document.children[0] as slime.runtime.document.Element;
				fifty.verify(root).children.length.is(2);
				fifty.verify(root).children[0].type.is("element");
				var foo = root.children[0] as slime.runtime.document.Element;
				fifty.verify(foo).name.is("foo");
				fifty.verify(root).children[1].type.is("element");
				var baz = root.children[1] as slime.runtime.document.Element;
				fifty.verify(baz).name.is("baz");
				var serialized = api.serialize.document({ settings: settings, document: document });
				fifty.verify(serialized == xml, "symmetric").is(true);
			};

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.happy);
				fifty.run(fifty.tests.attributes);
				fifty.run(fifty.tests.selfClosing);
				fifty.run(fifty.tests.voidElements);
				fifty.run(fifty.tests.multilineStartTag);
				fifty.run(fifty.tests.emptyAttribute);
				fifty.run(fifty.tests.optionalTags);
				fifty.run(fifty.tests.emptyTagsParsedCorrectly);
				fifty.run(fifty.tests.xml);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
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

				var settings: Settings = {};

				var document = html.parse.document({
					settings: settings,
					string: input,
					events: (function() {
						var stack = [];
						/**
						 * @type { slime.$api.event.Handlers<slime.runtime.document.source.ParseEvents> }
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

				var serialized = html.serialize.document({
					settings: settings,
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

			fifty.tests.manual.fidelity = function() {
				const { jsh } = fifty.global;

				var markup = jsh.file.Pathname(jsh.shell.environment.MARKUP).file.read(String);
				fifty.tests.fidelity(markup);
			}
		}
	//@ts-ignore
	)(fifty);

}
