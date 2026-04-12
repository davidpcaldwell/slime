//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.loader {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const runtime: slime.runtime.Exports = fifty.$loader.module("fixtures.ts").subject(fifty);
			return runtime.$api.loader;
		//@ts-ignore
		})(fifty);
	}

	/**
	 * A scoped script that will be executed with a runtime scope including a `$context` property that is supplied by the caller.
	 */
	export type Scoped<C,E> = ($context: C) => E

	export interface Store {
		script: <C,E>(path: string) => Scoped<C,E>

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

	export namespace synchronous {
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

		export type Script<C,E> = (c: C) => E
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

		list?: (path: string[]) => slime.$api.fp.Maybe<synchronous.Node[]>

		code: (t: T) => Code
	}

	export interface Exports {
		synchronous: {
			resources: <T>(filter: {
				resource: (path: string[], name: string) => boolean,
				parent: (path: string[]) => boolean
			}) => (loader: Synchronous<T>) => synchronous.Location[]

			scripts: <T,C,E>(loader: Synchronous<T>) => (script: string) => slime.runtime.loader.synchronous.Script<C,E>
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

namespace slime.runtime.internal.loader {
	export interface Context {
		$api: Pick<slime.$api.Global,"fp"|"content"|"mime"|"Function">
		methods: code.GlobalExecutorMethods
		Executor: code.executor.Constructor
		createScriptScope: code.Exports["internal"]["createScriptScope"]
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

	export type Script = slime.runtime.loader.Scoped<Context,slime.runtime.loader.Exports>
}
