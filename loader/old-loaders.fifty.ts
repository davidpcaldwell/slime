//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export namespace old.loader {
		/** @deprecated Can use slime.loader.Script directly. */
		export type Script<C,E> = slime.loader.Script<C,E>

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.script = fifty.test.Parent();

				fifty.tests.script.context = function() {
					function echo<T>(t: T): T {
						var script: slime.old.loader.Script<T,{ provided: T }> = fifty.$loader.script("test/data/context.js");
						return script(t).provided;
					}

					//	TODO	should these two tests pass? They do under new loader
					if (false) {
						var ifUndefined = echo(void(0));
						verify(ifUndefined).is.type("undefined");
						var ifNull = echo(null);
						verify(ifNull).is.type("null");
					}
					var ifString = echo("foo");
					verify(ifString).is.type("string");
					var ifNumber = echo(3);
					verify(ifNumber).is.type("number");
					var ifBoolean = echo(true);
					verify(ifBoolean).is.type("boolean");
					var ifObject = echo({ foo: "bar" });
					verify(ifObject).is.type("object");
					verify(ifObject).evaluate.property("foo").is("bar");
				}

				fifty.tests.script.export = function() {
					function echo<T>(t: T): T {
						var script: slime.old.loader.Script<{ export: T },T> = fifty.$loader.script("test/data/export.js");
						return script({ export: t });
					}

					var ifUndefined = echo(void(0));
					verify(ifUndefined).is.type("undefined");
					var ifNull = echo(null);
					verify(ifNull).is.type("null");
					var ifString = echo("foo");
					verify(ifString).is.type("string");
					var ifNumber = echo(3);
					verify(ifNumber).is.type("number");
					var ifBoolean = echo(true);
					verify(ifBoolean).is.type("boolean");
					var ifObject = echo({ foo: "bar" });
					verify(ifObject).is.type("object");
					verify(ifObject).evaluate.property("foo").is("bar");
				}
			}
		//@ts-ignore
		)(fifty);

		/** @deprecated Replaced by {@link Script}. */
		export type Product<C,E> = Script<C,E>

		/** @deprecated Can use slime.loader.Export directly. */
		export type Export<T> = slime.loader.Export<T>

		export namespace source {
			//	TODO	this does not seem like a great design
			/**
			 * Either a resource or a child loader contained within a Loader.
			 */
			export interface Entry {
				/**
				 * The name of this entry. It does *not* have a trailing slash for loaders.
				 */
				path: string

				/**
				 * Whether this entry represents a child loader (for example, a directory or folder)
				 */
				loader: boolean

				/**
				 * Whether this entry represents a resource.
				 */
				resource: boolean
			}
		}

		/**
		 * An object that provides the implementation for a {@link Loader}.
		 */
		export interface Source<S = never> {
			/**
			 * Provides the `toString` for the created Loader by default.
			 */
			toString?(): string

			/**
			 * Retrieves a resource.
			 *
			 * @param path The path from which to load a resource.
			 * @returns The resource at the given path, or `null` if there is none.
			 */
			get?: (path: string) => resource.Descriptor

			/**
			 * Returns a list of the top-level entries at a particular location in this loader.
			 *
			 * @param path A path under this loader to list. Currently, this will either be the empty
			 * string, in which case the top level should be listed, or it will be a path ending in `/`.
			 */
			list?: (path: string) => source.Entry[]

			thread?: {
				get: (path: string) => PromiseLike<resource.Descriptor>
			}

			/**
			 * Allows the loader to customize the way child sources are created when creating child loaders. If omitted, a child
			 * that delegates requests back to the parent, prepended by the child's path, will be created.
			 *
			 * @param prefix The path representing this child underneath the parent. Currently, this path can be either the empty
			 * string `""` or a string ending in `/`.
			 *
			 * @returns A source that represents a child of the parent source.
			 */
			child?: (prefix: string) => Source | S

			/**
			 * Allows the loader to customize the way resource descriptors are turned into resources.
			 */
			Resource?: runtime.resource.Exports
		}

		export interface Scope {
			$context: any
			$loader?: slime.old.Loader
			$exports: any
			$export: ($exports: any) => void
		}
	}

	export namespace old.loader.test {
		/**
		 * A script that exports a standard export structure to act as a test case for the loader API.
		 */
		export type Script = slime.old.loader.Script<{ scale: number }, { convert: (input: number) => number }>;
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var { tests, verify, $loader } = fifty;

			const subject: slime.runtime.Exports = fifty.$loader.module("fixtures.ts").subject(fifty);

			tests.types = {};

			var getType = function(value: any): { type: string } {
				if (value === null) return { type: "null" };
				return { type: typeof value };
			}

			tests.types.Loader = function(it: slime.runtime.Exports["old"]["Loader"]) {
				verify(getType(it)).type.is("function");
				var tools: { [x: string]: any } = it["tools"];
				verify(tools).is.type("object");
				verify(tools).evaluate.property("toExportScope").is.type("function");
			};

			tests.source = fifty.test.Parent();

			tests.source.object = function() {
				var api: slime.runtime.Exports = subject;
				verify(api).evaluate(function(p) { return p.old.loader.source.object; }).is.type("function");
				var source = api.old.loader.source.object({
					a: {
						resource: {
							read: {
								string: function() { return "a"; }
							}
						}
					},
					b: {
						loader: {
							c: {
								resource: {
									read: {
										string: function() { return "c"; }
									}
								}
							}
						}
					}
				});
				var readString = function(p: Resource) {
					if (typeof(p.read) != "function") throw new Error("p.read is " + typeof(p.read));
					return p.read(String);
				};
				var loader = new api.old.Loader(source);
				verify(loader).get("a").evaluate(readString).is("a");
				verify(loader).get("b/c").evaluate(readString).is("c");
				verify(loader).list().length.is(2);
			}

			tests.closure = function() {
				var closure: slime.old.loader.test.Script = $loader.value("test/data/closure.js");
				var context = { scale: 2 };
				var module = closure(context);
				verify(module).convert(2).is(4);
			};

			tests.$export = function() {
				fifty.run(function module() {
					var module: slime.old.loader.test.Script = $loader.script("test/data/module-export.js");
					var api = module({ scale: 2 });
					verify(api).convert(3).is(6);
				});

				fifty.run(function file() {
					var file: slime.old.loader.test.Script = $loader.script("test/data/file-export.js");
					var api = file({ scale: 2 });
					verify(api).convert(3).is(6);
				});
			}

			tests.thread = function() {
				var source: slime.old.loader.Source = {
					thread: {
						get: function(path) {
							if (path == "foo") {
								return Promise.resolve({
									read: {
										string: function() { return path.toUpperCase(); }
									}
								});
							} else if (path == "../js/web/module.js") {
								return Promise.resolve({
									read: {
										string: function() { return fifty.$loader.get("../js/web/module.js").read(String) }
									}
								});
							}
						}
					}
				};

				var loader = new subject.old.Loader(source);

				var readString = function(p: Resource): string { return p.read(String); };

				fifty.run(function thread_get() {
					loader.thread.get("foo").then(function(resource) {
						verify(resource).evaluate(readString).is("FOO");
					});
				});

				fifty.run(function thread_module() {
					var hasKey = function(string) {
						var rv = function(object) {
							return Object.keys(object).indexOf(string) != -1;
						};
						rv.toString = function() { return "hasKey(" + string + ")"; };
						return rv;
					}

					loader.thread.module("../js/web/").then(function(api: object) {
						verify(api).evaluate(hasKey("Url")).is(true);
						verify(api).evaluate(hasKey("Form")).is(true);
						verify(api).evaluate(hasKey("foo")).is(false);
					})
				});
			}

			tests.suite = function() {
				//fifty.run(fifty.tests.script);

				fifty.run(fifty.tests.source);
				fifty.run(fifty.tests.closure);
				fifty.run(fifty.tests.$export);
				fifty.run(fifty.tests.script);
				//	TODO	tests.thread, browser only?
			};

			fifty.test.platforms();
		}
	//@ts-ignore
	)(fifty);

}
namespace slime.old {
	export namespace loader {
		/**
		 * The scope provided to a script executed via the {@link Loader | Loader.value()} call.
		 */
		export interface ValueScope {
			/**
			 * Allows the code to return a single value to the caller by invoking this method with the value.
			 */
			$set: (v: any) => void
		}

		interface AnyEntry {
			path: string
		}

		export interface LoaderEntry extends AnyEntry {
			loader: slime.old.Loader
		}

		export interface ResourceEntry extends AnyEntry {
			resource: any
		}

		export type Entry = LoaderEntry | ResourceEntry
	}

	export interface Loader<S = never, R extends Resource = Resource> extends slime.Loader {
		source: loader.Source<S>

		/**
		 * Returns the resource associated with a given path, by invoking the `get` method of this loader's `source`.
		 *
		 * @param path A path.
		 */
		get: (path: string) => R

		/**
		 * (conditional method, present if `source.list` is present)
		 */
		list?: (m?: {
			filter?: slime.$api.fp.Predicate<any>
			descendants?: slime.$api.fp.Predicate<any>
		}) => loader.Entry[]

		Child: {
			(prefix: string): Loader<S,R>
		}

		//	TODO	update the below descriptions to reflect the $export method of exporting and the fact that exports need not be
		//			objects

		//	TODO	what if a value is exported? Like a number? We know a function works.

		thread?: {
			get: (path: string) => PromiseLike<Resource>
			module: (path: string, $context?: any, target?: any) => PromiseLike<any>
		}

		//	TODO	couldn't get the types quite right to satisfy impleentation; probably use of constructor for implementation
		//			is causing problems. So had to use some `any`s.

		toSynchronous: () => slime.runtime.loader.Synchronous<R>
	}

	export interface Loader<S = never, R extends Resource = Resource> extends slime.Loader {
		/** @deprecated Replaced by `script`. */
		factory: Loader<S,R>["script"]
	}
}

namespace slime.runtime.exports {
	export interface Old {
		loader: {
			source: {
				/**
				 * Creates an loader source defined by a single JavaScript object.
				 * @param o An object with named properties; each property either contains a loader object, in which case it
				 * is a loader which provides its children, or a resource object, whose properties are {@link resource.Descriptor}s.
				 */
				object: (o: object) => slime.old.loader.Source
			}

			/**
			 * A loader that uses a series of loaders to resolve resources. For a given path, each loader is searched in turn
			 * until a resource is found.
			 *
			 * The created loaders currently have the following limitations: <!---	TODO	address them	--->
			 *
			 * * They are not enumerable
			 * * They do not respect the `.child` implementations of their elements
			 * * They do not provide a sensible `.toString` implementation.
			 *
			 * @param loaders A list of {@link slime.Loader}s
			 * @returns A loader that looks up resources in the given list of underlying loaders.
			 *
			 * @experimental
			 */
			series: <S,R extends Resource>(loaders: old.Loader<S,R>[]) => old.Loader

			tools: {
				toExportScope: <S extends { [x: string]: any },T>(scope: S) => S & { $export: (t: T) => void, $exports: T }
			}

			from: {
				/**
				 * Adapter method that implements the old loader interface in terms of the new synchronous loader, for
				 * the purpose of using APIs that expect the old interface while using the new synchronous loader in new
				 * code.
				 *
				 * @param o A synchronous loader
				 * @returns An old loader that delegates to the synchronous loader.
				 */
				synchronous: (o: slime.runtime.loader.Synchronous<any>) => old.Loader
			}
		}
	}
}

namespace slime.runtime.internal.old_loaders {
	export interface Scope {
		$api: slime.$api.Global
		toExportScope: slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"]
		Resource: slime.runtime.resource.Exports
		methods: scripts.Exports["internal"]["methods"]
		createScriptScope: scripts.Exports["internal"]["createScriptScope"]
	}

	export interface Exports {
		api: slime.runtime.exports.Old["loader"]
		Code: {
			from: {
				Resource: slime.$api.fp.Mapping<slime.Resource,slime.runtime.loader.Code>
			}
		}
		constructor: runtime.loader.old.Constructor
	}

	export type Script = slime.old.loader.Script<Scope,Exports>
}
