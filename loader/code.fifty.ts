//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.loader {
	/**
	 * A JavaScript script, with a name (used by tooling) and a property containing JavaScript code.
	 */
	export interface Script {
		name: string
		js: string
	}

	/**
	 * An object that is capable of taking selected source files (often determined by MIME type) and translating them into
	 * JavaScript.
	 */
	export type Compiler<T> = slime.$api.fp.Partial<T,Script>;
}

namespace slime.runtime {
	export namespace loader {
		/**
		 * An object representing code, which has a name (for tooling), and which can provide a MIME type,
		 * and a string representing code. The most straightforward instances of this type are JavaScript scripts, but instances of
		 * this type can also be code written in other languages that can be transpiled into JavaScript (notably, TypeScript).
		 */
		export interface Code {
			name: string
			type: () => slime.mime.Type
			read: () => string
		}
	}
}

namespace slime.$api {
	export interface Scripts {
		/**
		 * Provides helper methods for implementing new {@link slime.runtime.loader.Compiler | Compiler}s.
		 */
		Code: {
			/**
			 * Given a string specifying a simple MIME type (e.g., `text/plain`, with no parameters), returns a
			 * {@link slime.$api.fp.Predicate} specifying whether a given {@link slime.runtime.loader.Code | Code} is of that
			 * type.
			 */
			isMimeType: slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.runtime.loader.Code>>
		}

		Compiler: {
			from: {
				/**
				 * Convenience method that, given a code predicate and compiler implementation, creates a `Compiler`.
				 *
				 * @template R A "resource" type used by some underlying representation of a code source
				 * @template I Some intermediate representation of the resource which can be used as input to the transpilation process
				 */
				//	TODO	can we figure out how to get the above template definitions to render in TypeDoc?
				simple: <R,I>(p: {
					accept: slime.$api.fp.Predicate<R>
					name: (r: R) => string
					read: (r: R) => I
					compile: slime.$api.fp.Mapping<I,string>
				}) => slime.runtime.loader.Compiler<R>
			}
		}
	}

	export interface Global {
		scripts: Scripts
	}
}

namespace slime.runtime.internal.code {
	export interface Scope {
		Packages: slime.runtime.Scope["Packages"]
		$engine: slime.runtime.Engine
		fp: slime.$api.fp.Exports
	}

	/**
	 * A function which executes code by compiling it using a supplied compiler and ensuring sensible defaults are supplied for the
	 * execution scope. The `this` target is taken directly from the caller and is not modified by the executor.
	 */
	export type Executor<R> = (this: { [name: string]: any }, code: R, scope: { [name: string]: any }) => void

	export namespace executor {
		export type Configuration<R> = {
			compiler: slime.runtime.loader.Compiler<R>
			unsupported: (r: R) => string

			/**
			 * Scope variables that should be provided to all code executed by the created `Executor`.
			 */
			scope: { [x: string]: any }
		}

		export type Constructor = <R>(p: Configuration<R>) => Executor<R>
	}


	export type GlobalExecutorMethods = {
		/**
		 * Compiles the given `code` script, executes it in a scope containing the values provided by `scope`, and using the
		 * `this` target with which the `run` function was invoked.
		 */
		run: (this: { [name: string]: any }, code: slime.runtime.loader.Code, scope: { [name: string]: any }) => void

		old: {
			value: (code: slime.runtime.loader.Code, scope: { [name: string]: any }) => any
			file: (code: slime.runtime.loader.Code, context: { [name: string]: any }) => { [x: string]: any }
		}
	}

	export type ScriptScope<C extends { [x: string]: any },T> = {
		$context: C
		$export: (t: T) => void
		$exports: T
	}

	export interface Runtime {
		compiler: slime.runtime.Exports["compiler"]

		internal: {
			methods: GlobalExecutorMethods
		}
	}

	export interface Exports {
		api: Omit<slime.$api.Global["scripts"],"compiler">

		internal: {
			/**
			 * Provides access to the `Executor` constructor for other, older APIs related to code execution.
			 */
			Executor: executor.Constructor

			createScriptScope: <C extends { [x: string]: any },T>($context: C) => ScriptScope<C,T>

			runtime: ($api: slime.$api.internal.Exports["exports"]) => Runtime

			old: {
				toExportScope: slime.$api.loader.old.Exports["old"]["loader"]["tools"]["toExportScope"]
			}
		}
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

	/**
	 * Code which deals with transpiler configuration, creation of scopes for scripts, and running scripts within specified scopes
	 * (providing `$platform` and `$api`).
	 */
	export type Script = slime.runtime.loader.Scoped<Scope,Exports>
}
