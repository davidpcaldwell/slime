//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.runtime.loader {
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

namespace slime.$api {
	export interface Global {
		/**
		 * Provides helper methods for implementing new {@link slime.runtime.loader.Compiler | Compiler}s.
		 */
		compiler: {
			/**
			 * Given a string specifying a simple MIME type (e.g., `text/plain`, with no parameters), returns a
			 * {@link slime.$api.fp.Predicate} specifying whether a given {@link slime.runtime.loader.Code | Code} is of that
			 * type.
			 */
			isMimeType: slime.$api.fp.Mapping<string,slime.$api.fp.Predicate<slime.runtime.loader.Code>>

			/**
			 * Convenience method that uses a code predicate and compiler implementation to create a `Compiler`.
			 */
			getTranspiler: <R,I>(p: {
				accept: slime.$api.fp.Predicate<R>
				name: (r: R) => string
				read: (r: R) => I
				compile: slime.$api.fp.Mapping<I,string>
			}) => slime.runtime.loader.Compiler<R>
		}
	}
}

namespace slime.runtime.internal.scripts {
	export interface Scope {
		$platform: slime.runtime.Platform
		$engine: slime.runtime.Engine
		$api: slime.$api.Global
	}

	export interface Exports {
		compiler: {
			update: slime.runtime.Exports["compiler"]["update"]
			get: slime.runtime.Exports["compiler"]["get"]
		}

		methods: {
			/**
			 * Compiles the given `code` script, executes it in a scope containing the values provided by `scope`, and using the
			 * `this` target with which the `run` function was invoked.
			 */
			run: (code: slime.runtime.loader.Code, scope: { [name: string]: any }) => void

			old: {
				value: (code: slime.runtime.loader.Code, scope: { [name: string]: any }) => any
				file: (code: slime.runtime.loader.Code, context: { [name: string]: any }) => { [x: string]: any }
			}
		}

		toExportScope: slime.runtime.Exports["old"]["loader"]["tools"]["toExportScope"]

		createScriptScope: <C extends { [x: string]: any },T>($context: C) => {
			$context: C
			$export: (t: T) => void
			$exports: T
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
	export type Script = slime.loader.Script<Scope,Exports>
}
