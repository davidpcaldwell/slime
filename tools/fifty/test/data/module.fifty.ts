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
		const { $api, jsh } = fifty.global;

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

		fifty.tests.wip = fifty.test.Parent();

		var run = (jsh) ? $api.fp.now(jsh.shell.subprocess.question, $api.fp.world.Sensor.mapping()) : void(0);

		var suite = function(part) {
			return run({
				command: fifty.jsh.file.relative("../../../../jsh").pathname,
				arguments: [
					"contributor/jrunscript.jsh.js",
					"-part", part
				],
				directory: fifty.jsh.file.relative("../../../..").pathname,
				stdio: {
					output: "string",
					error: "string"
				}
			});
		};

		var test = function(environment,file) {
			return run({
				command: fifty.jsh.file.relative("../../../../fifty").pathname,
				arguments: [
					"test." + environment,
					fifty.jsh.file.relative(file).pathname
				],
				stdio: {
					output: "string",
					error: "string"
				}
			});
		}

		fifty.tests.wip.indent = function() {
			var result = test("jsh", "load/child.fifty.ts");
			jsh.shell.console("===\n" + result.stdio.error + "\n===");

			var lines = result.stdio.error.split("\n");

			verify(lines[0]).evaluate(function(s) { return s.substring(0,2); }).is.not("  ");

			verify(lines[2]).evaluate(function(s) { return s.substring(0,2); }).is("  ");
			verify(lines[2]).evaluate(function(s) { return s.substring(0,3); }).is.not("   ");

			verify(lines[3]).evaluate(function(s) { return s.substring(0,4); }).is("    ");
			verify(lines[3]).evaluate(function(s) { return s.substring(0,5); }).is.not("     ");
		};

		const bubble = function(where) {
			return function() {
				var result = test(where, "load/bubble.fifty.ts");
				jsh.shell.console("===\n" + result.stdio.error + "\n===");
				//	TODO	exit status 1 is pretty vague; could be lots of reasons
				verify(result).status.is(1);
			}
		};

		fifty.tests.wip.bubble = fifty.test.Parent();

		fifty.tests.wip.bubble.jsh = bubble("jsh");
		fifty.tests.wip.bubble.browser = bubble("browser");

		fifty.tests.wip.jsapi = function() {
			var result = suite("jsapi/fifty");
			jsh.shell.console("===\n" + result.stdio.error + "\n===");
			verify(result).status.is(0);
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
