//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export interface Loader<R extends Resource = Resource> {
		source: loader.Source

		get: (path: string) => R
		list?: (m?: { filter?: any, descendants?: any }) => ( loader.LoaderEntry | loader.ResourceEntry )[]
		Child: {
			(prefix: string): Loader
		}

		run: (path: string, scope?: any, target?: any) => void
		value: (path: string, scope?: any, target?: any) => any
		file: (path: string, $context?: any, target?: any) => any
		module: (path: string, $context?: any, target?: any) => any
		script: <C,E>(path: string) => loader.Script<C,E>

		thread?: {
			get: (path: string) => PromiseLike<Resource>
			module: (path: string, $context?: any, target?: any) => PromiseLike<any>
		}

		/** @deprecated Replaced by `script`. */
		factory: Loader<R>["script"]
	}

	export namespace loader {
		interface Entry {
			path: string
		}

		export interface LoaderEntry extends Entry {
			loader: slime.Loader
		}

		export interface ResourceEntry extends Entry {
			resource: any
		}

		export interface Script<C,E> {
			(c?: C): E
			thread: (c?: C) => PromiseLike<E>
		}

		/** @deprecated Replaced by {@link Script}. */
		export type Product<C,E> = Script<C,E>

		export type Export<T> = (value: T) => void

		/**
		 * An object that provides the implementation for a {@link Loader}.
		 */
		export interface Source {
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
			get?: (path: string) => resource.HistoricSupportedDescriptor

			list?: (path: string) => {
				path: string
				loader: boolean
				resource: boolean
			}[]

			thread?: {
				get: (path: string) => PromiseLike<resource.HistoricSupportedDescriptor>
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
			child?: (prefix: string) => Source

			/**
			 * Allows the loader to customize the way resource descriptors are turned into resources.
			 */
			Resource?: resource.Exports
		}

		export interface Scope {
			$context: any
			$loader?: slime.Loader
			$exports: any
			$export: ($exports: any) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			var tests = fifty.tests;
			var verify = fifty.verify;
			var $loader = fifty.$loader;

			const subject: slime.runtime.Exports = fifty.$loader.module("fixtures.ts").subject(fifty);

			tests.types = {};

			tests.types.Loader = function(it: slime.runtime.Exports["Loader"]) {
				verify(it).is.type("function");
				var tools: { [x: string]: any } = it.tools;
				verify(tools).is.type("object");
				verify(tools).evaluate.property("toExportScope").is.type("function");
			};

			tests.suite = function() {
				fifty.run(tests.source);
				fifty.run(tests.closure);
				fifty.run(tests.$export);
			}

			tests.source = function() {
				fifty.run(tests.source.object);
			};

			tests.source.object = function() {
				var api: slime.runtime.Exports = subject;
				verify(api).evaluate(function() { return this.Loader.source.object; }).is.type("function");
				var source = api.loader.source.object({
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
				var loader = new api.Loader(source);
				verify(loader).get("a").evaluate(readString).is("a");
				verify(loader).get("b/c").evaluate(readString).is("c");
				verify(loader).list().length.is(2);
			}

			tests.closure = function() {
				var closure: slime.test.factory = $loader.value("test/data/closure.js");
				var context = { scale: 2 };
				var module = closure(context);
				verify(module).convert(2).is(4);
			};

			tests.$export = function() {
				fifty.run(function module() {
					var module: slime.test.factory = $loader.script("test/data/module-export.js");
					var api = module({ scale: 2 });
					verify(api).convert(3).is(6);
				});

				fifty.run(function file() {
					var file: slime.test.factory = $loader.script("test/data/file-export.js");
					var api = file({ scale: 2 });
					verify(api).convert(3).is(6);
				});
			}

			tests.thread = function() {
				var source: loader.Source = {
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

				var loader = new subject.Loader(source);

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
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.runtime.internal.loader {
	export interface Scope {
		Resource: slime.resource.Exports
		methods: scripts.Exports["methods"]
		createScriptScope: scripts.Exports["createScriptScope"]
		$api: slime.$api.Global
	}

	export type Constructor = new (p: slime.loader.Source) => Loader

	export type Script = slime.loader.Script<Scope,Constructor>
}
