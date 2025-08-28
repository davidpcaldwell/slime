//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime {
	export namespace runtime.loader.test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const runtime: slime.runtime.Exports = fifty.$loader.module("fixtures.ts").subject(fifty);
			return runtime.loader;
		//@ts-ignore
		})(fifty);
	}

	export namespace runtime.loader {
		export type Module<C,E> = ($context: C) => E

		export interface Store {
			script: <C,E>(path: string) => Module<C,E>

			/**
			 * @deprecated Exists for compatibility with {@link slime.Loader} and likely to be removed.
			 *
			 * Immediately executes the script at the given path, using the given scope as the script's scope, and the given target
			 * as the `this` target for the script.
			 */
			run: <S,T>(path: string, scope: S, target: T) => void
		}

		export interface Exports {
			Store: {
				content: <T>(p: {
					store: slime.runtime.content.Store<T>
					compiler: slime.runtime.loader.Compiler<T>
					//	TODO	this generates an error; should the caller actually be able to configure that behavior? Should this
					//			just be a void method where the caller can choose not to do anything? But then what should the
					//			attempt to load the script do? What should the attempt to execute the script do?
					unsupported: (t: T) => string
					scope: { [x: string]: any }
				}) => Store
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api } = fifty.global;

				fifty.tests.Store = fifty.test.Parent();
				fifty.tests.Store.from = fifty.test.Parent();

				fifty.tests.Store.from.default = function() {
					const { verify } = fifty;
					const { jsh } = fifty.global;

					if (jsh) {
						//	TODO	this implementation does not currently support the usage of the global transpiler
						var $loader = jsh.loader.Store.content({
							store: jsh.file.Location.directory.content.Index( fifty.jsh.file.relative(".") ),
							compiler: function(t) {
								return {
									present: true,
									value: {
										name: t.pathname,
										js: $api.fp.now(t, jsh.file.Location.file.read.string.simple)
									}
								};
							},
							unsupported: function(t) { return "Unreachable."; },
							scope: {}
						});
						var code: slime.runtime.loader.internal.test.store.Script = $loader.script("test/data/store/module.js");
						var api = code({
							n: 8
						});
						verify(api).calculated.doubled.is(16);
						verify(api).calculated.squared.is(64);
					}
				}
			}
		//@ts-ignore
		)(fifty);
	}

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

		/**
		 * Associated functions can be found in {@link slime.runtime.loader.Exports | `Exports.synchronous`}.
		 */
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

				scripts: <T,C,E>(loader: Synchronous<T>) => (script: string) => slime.loader.synchronous.Script<C,E>
			}
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
					var no = test.subject.synchronous.scripts(loader)("foo");
					verify(no).is(null);
				}

				fifty.tests.script.context = function(loader: Synchronous<any>) {
					function echo<T>(t: T): T {
						if (!test.subject.synchronous.scripts) throw new Error("No 'scripts'");
						var scripts = test.subject.synchronous.scripts(loader);
						var script = scripts("loader/test/data/context.js") as <C>(c: C) => { provided: C };
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
			/**
			 * Provides operations related to loading resources and executing code using {@link slime.runtime.loader} types.
			 */
			loader: slime.runtime.loader.Exports
		}
	}

	export namespace loader {
		export interface Script<C,E> {
			(c: C): E
			thread: (c: C) => PromiseLike<E>
		}

		export type Export<T> = (value: T) => void
	}

	/**
	 * An object capable of loading {@link slime.Resource}s from given paths.
	 *
	 * Note that two related APIs are defined:
	 *
	 * * {@link slime.runtime.loader.Synchronous}, which allows loading arbitrary types from paths (which can, in turn, be turned
	 * into {@link slime.runtime.loader.Code}), and
	 * * {@link slime.old.Loader}, which is a subtype of `Loader` that contains additional APIs related to
	 * _sources_ (implementations), enumerability, custom children, asynchrony, and other deprecated APIs.
	 */
	export interface Loader {
		//	TODO	What about if $context is a number, string, or boolean?
		script: <C,E>(path: string) => loader.Script<C,E>

		/**
		 * Executes code in a particular scope with a particular `this` value. The code will automatically contain the
		 * {@link slime.runtime.Platform | `$platform`} and {@link slime.$api.Global | `$api`} objects described in
		 * {@link slime | Using SLIME | APIs for all platforms}.
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
}

namespace slime.runtime.loader.old {
	/**
	 * @param p The implementation of this `Loader`.
	 */
	export type Constructor = new <S>(p: slime.old.loader.Source | S) => slime.old.Loader<S>
}

namespace slime.runtime.internal.loader {
	export interface Scope {
		$api: Pick<slime.$api.Global,"fp"|"content">
		methods: scripts.GlobalExecutorMethods
		Executor: scripts.executor.Constructor
		createScriptScope: scripts.Exports["internal"]["createScriptScope"]
	}

	export interface Exports {
		api: slime.runtime.loader.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.old.loader.Script<Scope,Exports>
}
