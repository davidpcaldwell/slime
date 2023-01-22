//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export namespace loader {
		export namespace synchronous {
			export type Script<C,E> = (c: C) => E
		}
	}

	export namespace runtime.loader {
		export interface Node {
			name: string
			resource: boolean
			parent: boolean
		}

		/**
		 * A location within a loader, consisting of a (possibly empty) path, an ordered set of names of parents of the location,
		 * and a `name` within that path.
		 */
		export interface Location {
			path: string[]
			name: string
		}

		export interface Code {
			name: string
			type: () => slime.mime.Type
			read: () => string
		}

		export interface Synchronous<T> {
			/**
			 * Returns the resource associated with a given path.
			 *
			 * @param path A path.
			 */
			get: (path: string[]) => slime.$api.fp.Maybe<T>

			list?: (path: string[]) => slime.$api.fp.Maybe<Node[]>

			code: (t: T) => Code
		}

		export interface Exports {
			synchronous: {
				resources: <T>(filter: {
					resource: (path: string[], name: string) => boolean,
					parent: (path: string[]) => boolean
				}) => (loader: Synchronous<T>) => Location[]

				script: (path: string) => <T,C,E>(loader: Synchronous<T>) => slime.loader.synchronous.Script<C,E>
			}
		}

		export namespace test {
			export const subject = (function(fifty: slime.fifty.test.Kit) {
				const runtime: slime.runtime.Exports = fifty.$loader.module("fixtures.ts").subject(fifty);
				return runtime.loader;
			//@ts-ignore
			})(fifty);
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				/**
				 * A test that accepts a {@link Synchronous} that loads files from this directory and tests its ability to load
				 * scripts correctly.
				 *
				 * @param loader A loader that loads files from this source directory.
				 */
				fifty.tests.script = function(loader: Synchronous<any>) {
					fifty.run(function missing() { fifty.tests.script.missing(loader); });
					fifty.run(function context() { fifty.tests.script.context(loader); });
				};

				fifty.tests.script.missing = function(loader: Synchronous<any>) {
					var no = test.subject.synchronous.script("foo")(loader);
					verify(no).is(null);
				}

				fifty.tests.script.context = function(loader: Synchronous<any>) {
					function echo<T>(t: T): T {
						if (!test.subject.synchronous.script) throw new Error("No 'script'");
						var at = test.subject.synchronous.script("loader/test/data/context.js");
						if (!at) throw new Error("No 'at'");
						debugger;
						var script: <C>(c: C) => { provided: C } = at(loader);
						if (!script) throw new Error("No script");
						return script(t).provided;
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
	}

	export namespace runtime.loader {
		export interface Exports {
			object: {
				Synchronous: <T>(loader: runtime.loader.Synchronous<T>) => object.Synchronous
			}
		}

		export namespace object {
			export interface Synchronous {
				script: <C,E>(path: string) => ($context: C) => E
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;

					fifty.tests.object = function(loader: slime.runtime.loader.Synchronous<any>) {
						fifty.run(function script() {
							fifty.tests.object.script(loader);
						});
					};

					fifty.tests.object.script = function(loader: slime.runtime.loader.Synchronous<any>) {
						var object = test.subject.object.Synchronous(loader);

						var script: <C>(c: C) => { provided: C } = object.script("loader/test/data/context.js");

						function echo<T>(t: T): T {
							return script(t).provided;
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
		}
	}

	export namespace runtime {
		export interface Exports {
			loader: slime.runtime.loader.Exports
		}
	}

	export namespace loader {
		export interface Script<C,E> {
			(c?: C): E
			thread: (c?: C) => PromiseLike<E>
		}

		export type Export<T> = (value: T) => void
	}

	export interface Loader {
		//	TODO	What about if $context is a number, string, or boolean?
		script: <C,E>(path: string) => loader.Script<C,E>

		//	TODO	the $platform and $api objects are not described "above" and probably should be links
		/**
		 * Executes code in a particular scope with a particular `this` value. The code will automatically contain the `$platform`
		 * and `$api` objects described above in its scope.
		 *
		 * @param path The path of the code to execute.
		 * @param scope The scope in which to execute the code.
		 * @param target The object to use as the `this` value when executing the code.
		 */
		run: (path: string, scope?: any, target?: any) => void

		/**
		 * Identical to `run`, except that the code to execute is supplied with a `$set` function in its scope that allows it to set
		 * a value to be returned to the caller:
		 *
		 * @param path The path of the code to execute.
		 * @param scope The scope in which to execute the code.
		 * @param target The object to use as the `this` value when executing the code.
		 * @returns The value the code to execute passed to `$set`, or `undefined` if `$set` was not invoked.
		 */
		value: (path: string, scope?: any, target?: any) => any

		/**
		 * Executes a script in a separate scope. The scope will contain the `$platform` and `$api` objects described above. In
		 * addition, the script will be provided with special objects named `$context` and `$exports`. The `$context` object
		 * represents an application-specific context to provide to the script; the `$exports` object represents an object to which
		 * the script can assign properties that will be visible outside the script.
		 *
		 * @param path The path of the code to execute.
		 * @param $context A value to use as the `$context` object when executing the given code. If undefined or `null`, the
		 * value provided is not specified.
		 * @param target The object to use as the `this` value when executing the code.
		 * @returns The value exported by this module.
		 */
		file: (path: string, $context?: any, target?: any) => any

		/**
		 * Loads a module. The module's code is specified by the first argument, and the second argument specifies objects to be
		 * supplied to the module when loading it.
		 *
		 * The module's main file will be executed with the following variables in scope:
		 *
		 * * the `$platform` and `$api` objects specified above,
		 * * the `$context` value specified by the second argument,
		 * * an `$exports` object,
		 * * a `$loader` object of type {@link Loader} allowing other source files and submodules to be loaded.
		 *
		 * @param path The path of the code to execute.
		 * @param $context A value to use as the `$context` object when executing the given code. If undefined or `null`, the
		 * value provided is not specified.
		 * @param target The object to use as the `this` value when executing the code.
		 * @returns The value exported by this module.
		 */
		module: (path: string, $context?: any, target?: any) => any

		/**
		 * Returns the resource associated with a given path, by invoking the `get` method of this loader's `source`.
		 *
		 * @param path A path.
		 */
		get: (path: string) => Resource
	}

	export namespace old {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.old = {};
			}
		//@ts-ignore
		)(fifty);

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
			list?: (m?: { filter?: any, descendants?: any }) => loader.Entry[]

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
		}

		export interface Loader<S = never, R extends Resource = Resource> extends slime.Loader {
			/** @deprecated Replaced by `script`. */
			factory: Loader<S,R>["script"]
		}
	}

	export namespace old.loader {
		/** @deprecated Can use slime.loader.Script directly. */
		export type Script<C,E> = slime.loader.Script<C,E>

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				fifty.tests.old.script = fifty.test.Parent();

				fifty.tests.old.script.context = function() {
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

				fifty.tests.old.script.export = function() {
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

			tests.types.Loader = function(it: slime.runtime.Exports["old"]["loader"]) {
				verify(it).is.type("function");
				var tools: { [x: string]: any } = it.tools;
				verify(tools).is.type("object");
				verify(tools).evaluate.property("toExportScope").is.type("function");
			};

			tests.source = function() {
				fifty.run(tests.source.object);
			};

			tests.source.object = function() {
				var api: slime.runtime.Exports = subject;
				verify(api).evaluate(function() { return this.old.Loader.source.object; }).is.type("function");
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
				fifty.run(fifty.tests.old.script);
				//	TODO	tests.thread, browser only?
			};

			if (fifty.jsh) tests.platforms = fifty.jsh.platforms(fifty);
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.runtime.loader.old {
	/**
	 * @param p The implementation of this `Loader`.
	 */
	export type Constructor = new <S>(p: slime.old.loader.Source | S) => slime.old.Loader<S>
}

namespace slime.runtime.internal.loader {
	export interface Scope {
		Resource: slime.runtime.resource.Exports
		methods: scripts.Exports["methods"]
		createScriptScope: scripts.Exports["createScriptScope"]
		$api: slime.$api.Global
	}

	export interface Exports {
		old: slime.runtime.loader.old.Constructor
		api: slime.runtime.loader.Exports
	}

	export type Script = slime.old.loader.Script<Scope,Exports>
}
