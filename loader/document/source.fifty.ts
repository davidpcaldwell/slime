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
	}

	export interface Document extends Parent {
		type: "document"
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
			fifty.tests.suite = function() {
				var api: Export = fifty.$loader.module("source.js");
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
				debugger;
				if (false) fifty.verify(serialized).is(input);
			}
		}
	//@ts-ignore
	)(fifty);
}
