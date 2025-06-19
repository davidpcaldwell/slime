//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * The SLIME native document parser is a parser and serializer that handles HTML (and XHTML/XML) documents, converting them to a
 * tree structure (which is somewhat analogous to a DOM tree).
 *
 * The produced tree conforms to the HTML DOM specification, so (for example) whitespace may be altered when parsing.
 */
namespace slime.runtime.document.old {
	export interface Context {
		/**
		 * Only used when using the JSoup implementation.
		 */
		$slime?: Pick<slime.jsh.plugin.$slime,"java">
	}

	export interface Exports {
		//	TODO	one remaining use of this, in loader/api/old/jsh/html.js. Is that code dead?
		//			looks like it is probably used as part of running JSAPI tests
		load: (p: { string: string }) => any
	}

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

				fifty.run(function codec() {
					var page = api.load({
						string: fifty.$loader.get("test/data/1.html").read(String)
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
				if (api.load) {
					fifty.run(fifty.tests.old);
				} else {
					const MESSAGE = "Native parser not present.";
					fifty.verify(MESSAGE).is(MESSAGE);
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>;
}
