//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.content {
	export interface Store<T> {
		get: (path: string[]) => slime.$api.fp.Maybe<T>
	}

	export interface ContentEntry<T> {
		name: string
		value: T
	}

	export interface IndexEntry<T> {
		name: string
		index: Index<T>
	}

	export type Entry<T> = ContentEntry<T> | IndexEntry<T>

	export interface Index<T> extends Store<T> {
		list: (path: string[]) => slime.$api.fp.Maybe<Entry<T>[]>
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.mock = function() {
				var api = (
					function() {
						var code: slime.runtime.internal.content.Script = fifty.$loader.script("content.js");
						return code();
					}
				)();

				var fixtures = (
					function() {
						var code: slime.runtime.test.Script = fifty.$loader.script("fixtures.ts");
						return code();
					}
				)();

				var content: slime.runtime.test.mock.Content<string> = fixtures.mock.content();

				content.set("lower/a", "a");
				content.set("lower/b", "b");
				content.set("upper/b", "B");
				content.set("asterisk", "*");

				const nullable = <T>(m: slime.$api.fp.Maybe<T>): T => {
					if (m.present) return m.value;
					return null;
				}

				const withName: (name: string) => (entries: Entry<string>[]) => Entry<string> = function(name) {
					return function(entries) {
						return entries.find(function(entry) { return entry.name == name; });
					}
				};

				const hasName: (name: string) => (entries: Entry<string>[]) => boolean = function(name) {
					return function(entries) {
						return Boolean(withName(name)(entries));
					}
				};

				var store = content.store;
				verify(store).get(["lower","b"]).evaluate(nullable).is("b");
				verify(store).get(["upper","b"]).evaluate(nullable).is("B");
				verify(store).get(["a"]).evaluate(nullable).is(null);

				var index = content.index;
				var top = nullable(index.list([]));
				verify(top).length.is(3);
				verify(top).evaluate(hasName("lower")).is(true);
				verify(top).evaluate(hasName("upper")).is(true);
				verify(top).evaluate(hasName("asterisk")).is(true);
				verify(top).evaluate(hasName("aaa")).is(false);
				verify(top).evaluate(withName("lower")).evaluate(api.Entry.is.IndexEntry).is(true);
				verify(top).evaluate(withName("upper")).evaluate(api.Entry.is.IndexEntry).is(true);
				verify(top).evaluate(withName("asterisk")).evaluate(api.Entry.is.IndexEntry).is(false);

				var lower = nullable(index.list(["lower"]));
				verify(lower).length.is(2);
				verify(lower).evaluate(hasName("a")).is(true);
				verify(lower).evaluate(hasName("b")).is(true);

				var upper = nullable(index.list(["upper"]));
				verify(upper).length.is(1);
				verify(upper)[0].evaluate.property("name").is("b");
				verify(upper)[0].evaluate.property("value").is("B");
				debugger;

				var no = nullable(index.list(["foo"]));
				verify(no).is(null);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		Store: {
			map: <T>(p: {
				path: string[]
				store: Store<T>
			}) => slime.$api.fp.Transform<Store<T>>
		}

		Entry: {
			is: {
				IndexEntry: <T>(e: Entry<T>) => e is IndexEntry<T>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			fifty.tests.exports.Store = fifty.test.Parent();

			fifty.tests.exports.Store.map = function() {
				var code: slime.runtime.test.Script = fifty.$loader.script("fixtures.ts");
				var fixtures = code();

				var mappedContent: slime.runtime.test.mock.Content<string> = fixtures.mock.content();
				mappedContent.set("baz/bizzy", "busy!");

				var content: slime.runtime.test.mock.Content<string> = fixtures.mock.content();
				var after = fifty.global.$api.content.Store.map({
					path: ["foo","bar"],
					store: mappedContent.store
				})(content.store);

				const nullable = <T>(m: slime.$api.fp.Maybe<T>): T => {
					if (m.present) return m.value;
					return null;
				}

				verify(after).get(["foo", "bar", "baz", "bizzy"]).evaluate(nullable).is("busy!");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.$api {
	export interface Global {
		content: slime.runtime.content.Exports
	}
}

namespace slime.runtime.internal.content {
	export type Context = void

	export type Exports = slime.runtime.content.Exports

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
				fifty.run(fifty.tests.mock);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
