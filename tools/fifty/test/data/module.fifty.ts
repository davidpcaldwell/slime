//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Contains types used for testing Fifty itself. Not intended for external use.
 */
namespace slime.fifty.internal.test.data {
	export namespace shopping {
		/**
		 * Something on the shopping list.
		 */
		interface Item {
			/**
			 * The name of the thing on the shopping list.
			 */
			name: string
		}

		/**
		 * A compendium of wanted items.
		 */
		export interface Database {
			items: Item[],
			add: (p: { item: Item }) => void
		}

		export interface Exports {
			Database: new () => Database
		}
	}
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { verify } = fifty;

		fifty.tests.types = {};

		fifty.tests.types.Database = function(database: slime.fifty.internal.test.data.shopping.Database) {
			var before = database.items.length;
			database.add({ item: { name: "foo" }});
			verify(database).items.length.is(before + 1);
			verify(database).items[0].name.is("foo");
		}

		fifty.tests.types.Exports = function(exports: slime.fifty.internal.test.data.shopping.Exports) {
			var db = new exports.Database();
			fifty.tests.types.Database(db);
		}

		fifty.tests.subsuite = function() {
			verify(1).is(1);
		}

		fifty.tests.suite = function() {
			//	TODO	use more modern script loading techniques
			var module: slime.fifty.internal.test.data.shopping.Exports = fifty.$loader.module("module.js");
			fifty.run(function() {
				fifty.tests.types.Exports(module);
			});
			fifty.run(fifty.tests.subsuite);
			fifty.load("load/child.fifty.ts");

			//	Small demonstration of using function name to name a subsuite
			fifty.run(function name() {
				verify("function name").is("function name");
			});

			fifty.load("no-suite.fifty.ts");
			//	TODO	this suite is run by a JSAPI call into Fifty at loader/api/old/fifty/api.html, but seems like the execution
			//			can't possibly be working because the below suite should fail
			fifty.load("promises.fifty.ts");
		}
	}
//@ts-ignore
)(fifty);
