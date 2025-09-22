//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides a set of common types for representing hierarchies of contents: for example, filesystems, URL spaces, searchpaths,
 * archives like TAR and ZIP files, and so forth.
 *
 * The `$api.content` APIs provide no implementations of these constructs, but other namespaces do. What the `$api.content` APIs
 * do provide are a standard set of operations for manipulating these hierarchies, so that you can use the same constructs to
 * set up a searchpath in any hierarchy, or the same constructs to do MIME-type analysis in any hierarchy.
 *
 * The {@link Exports} type, presented to applications as `$api.content`, provides interfaces for using these types.
 */
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
			/**
			 * Given a mapping consisting of a path and a `Store` to map to that path, returns a transform.
			 *
			 * The transform, given an existing `Store`, returns a `Store` that uses the given mapping for requests for the mapped
			 * path, and the existing Store for all other requests.
			 *
			 * @param p A mapping specifying a path and a store to which to map requests for that path.
			 *
			 * @returns A transform that, given an existing Store, can return a Store that is the same, but has the mapping added to
			 * it.
			 */
			set: <T>(p: {
				path: string[]
				store: Store<T>
			}) => slime.$api.fp.Transform<Store<T>>

			/**
			 * Given a `Store` and a path within it, returns a `Store` that uses that path as the root for a new `Store`.
			 */
			at: <T>(p: {
				path: string[]
				store: Store<T>
			}) => Store<T>

			map: <T,R>(f: (t: T) => R) => (store: Store<T>) => Store<R>
		}

		Entry: {
			is: {
				/**
				 * A TypeScript type predicate indicating whether the given `Entry` is an `IndexEntry`.
				 */
				IndexEntry: <T>(e: Entry<T>) => e is IndexEntry<T>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			var code: slime.runtime.test.Script = fifty.$loader.script("fixtures.ts");
			var fixtures = code();

			const nullable = <T>(m: slime.$api.fp.Maybe<T>): T => {
				if (m.present) return m.value;
				return null;
			}

			const subject = fifty.global.$api.content;

			fifty.tests.exports.Store = fifty.test.Parent();

			fifty.tests.exports.Store.set = function() {
				var mappedContent: slime.runtime.test.mock.Content<string> = fixtures.mock.content();
				mappedContent.set("baz/bizzy", "busy!");

				var content: slime.runtime.test.mock.Content<string> = fixtures.mock.content();
				var after = fifty.global.$api.content.Store.set({
					path: ["foo","bar"],
					store: mappedContent.store
				})(content.store);

				verify(after).get(["foo", "bar", "baz", "bizzy"]).evaluate(nullable).is("busy!");
			}

			fifty.tests.exports.Store.at = function() {
				var mappedContent: slime.runtime.test.mock.Content<string> = fixtures.mock.content();
				mappedContent.set("foo/bar/baz", "busy!");

				var foobar = fifty.global.$api.content.Store.at({
					store: mappedContent.store,
					path: ["foo","bar"]
				});

				verify(foobar).get(["foo", "bar", "baz"]).evaluate(nullable).is(null);
				verify(foobar).get(["baz"]).evaluate(nullable).is("busy!");
			}

			fifty.tests.exports.Store.map = function() {
				var mappedContent: slime.runtime.test.mock.Content<number> = fixtures.mock.content();

				mappedContent.set("washington", 1);
				mappedContent.set("jefferson", 3);

				var cubed = subject.Store.map( (n: number) => n*n*n )(mappedContent.store);

				var assert = function(m: slime.$api.fp.Maybe<number>): number {
					if (!m.present) throw new Error();
					return m.value;
				}

				verify(cubed).get(["washington"]).evaluate(assert).is(1);
				verify(cubed).get(["jefferson"]).evaluate(assert).is(27);
			}
		}
	//@ts-ignore
	)(fifty);
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
