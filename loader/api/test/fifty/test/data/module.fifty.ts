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

	(
		function(
			fifty: slime.fifty.test.kit,
			verify: slime.fifty.test.verify,
			tests: slime.fifty.test.tests,
			$loader: slime.fifty.test.$loader,
			run: slime.fifty.test.kit["run"],
			load: slime.fifty.test.load
		) {
			tests.types.Database = function(database: slime.fifty.internal.test.data.shopping.Database) {
				var before = database.items.length;
				database.add({ item: { name: "foo" }});
				verify(database).items.length.is(before + 1);
				verify(database).items[0].name.is("foo");
			}

			tests.types.Exports = function(exports: slime.fifty.internal.test.data.shopping.Exports) {
				var db = new exports.Database();
				tests.types.Database(db);
			}

			tests.subsuite = function() {
				verify(1).is(1);
			}

			tests.suite = function() {
				var module: slime.fifty.internal.test.data.shopping.Exports = $loader.module("module.js");
				run(function() {
					tests.types.Exports(module);
				});
				run(tests.subsuite);
				load("load/child.fifty.ts");

				//	Small demonstration of using function name to name a subsuite
				run(function name() {
					verify("function name").is("function name");
				})
			}
		}
	//@ts-ignore
	)(fifty, verify, tests, $loader, run, load)
}