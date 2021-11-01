//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.document {
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

	export namespace xml {
		export interface Declaration extends Node {
			type: "xml-declaration"
			data: string
		}

		export interface Cdata extends Node {
			type: "cdata",
			data: string
		}
	}

	export interface Context {
		$slime?: old.Context["$slime"]
	}

	export interface Export {
		load: old.Exports["load"]

		codec: {
			document: slime.Codec<Document,string>
		}
	}

	export type Script = slime.loader.Script<Context,Export>
}

namespace slime.jsh {
	export interface Global {
		document: slime.runtime.document.Export & slime.jrunscript.document.Export
	}
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

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			var load: Script = fifty.$loader.script("module.js");

			var isBrowser = Boolean(fifty.global.window);
			var isJsh = Boolean(fifty.global.jsh);
			var api: Exports = load({
				$slime: (isJsh) ? fifty.global.jsh.unit.$slime : void(0)
			});

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
					testsFor1(reparsed,fifty.verify,isJsh);
					//	TODO	below does not work in JSoup 1.12.1, which messes up some pieces of whitespace
					//	TODO	below does not work in browser, either
					//	See https://stackoverflow.com/questions/57394776/why-does-domparser-alter-whitespace
					if (false) {
						fifty.verify(string).is(fifty.$loader.get("test/data/1.html").read(String));
					}
				});
			}

			fifty.tests.suite = function() {
				fifty.load("source.fifty.ts");

				fifty.run(fifty.tests.old);
			}
		}
	//@ts-ignore
	)(fifty);
}
