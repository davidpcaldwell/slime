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

	export interface Comment extends Node {
		type: "comment",
		data: string
	}

	export interface Document {
		children: Node[]
	}

	export namespace internal {
		export interface Position {
			document: string
			offset: number
		}

		export interface State {
			parsed: Document
			position: Position
		}

		//	temporary, until parser is complete
		export interface Unparsed extends Node {
			string: string
		}

		export type Parser = (state: State) => Document
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
