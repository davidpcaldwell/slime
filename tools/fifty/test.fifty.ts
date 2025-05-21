//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Fifty allows tests to be embedded in TypeScript definitions.
 *
 * It does so by providing tools that
 * execute definitions (in both the browser and using the {@link slime.jsh | `jsh`} shell) providing a scope variable to the
 * tests called {@link slime.fifty.test.Kit | `fifty` } allowing tests to be defined.
 *
 * A minimal Fifty test file looks something like this:
 * ```
 * namespace foo.bar {
 * 	(
 *		function(
 *			fifty: slime.fifty.test.kit
 *		) {
 *			fifty.tests.suite = function() {
 *				fifty.verify(1).is(1);
 *			}
 *		}
 *	//@ts-ignore
 *	)(fifty);
 * }
 * ```
 *
 * Fifty tests can be embedded directly in TypeScript namespaces as
 * {@link https://developer.mozilla.org/en-US/docs/Glossary/IIFE | IIFEs }
 * that take the `fifty` object as an argument. The use of `fifty` must be `@ts-ignore`d because TypeScript does not understand
 * that it is present.
 *
 * The Fifty test-running tools can invoke functions attached to the `fifty.tests` object, which is scoped to the test file
 * being executed. By default, they run the `suite()` function. Within test functions, test subjects can be created with the
 * `fifty.verify()` function, which creates subjects that have various methods that can be invoked to represent assertions.
 *
 * For details, see the documentation on {@link slime.fifty.test.Kit | the `fifty` object}.
 *
 * ## Working with Fifty tests
 *
 * Fifty tests can be run using `jsh`.
 *
 * ### Running Fifty tests under `jsh`
 *
 * To run a Fifty test definition on the `jsh` platform:
 * `./fifty test.jsh [--debug:rhino | --debug:none] file.fifty.ts [--part part]`
 *
 * ### Running Fifty tests in a browser
 *
 * To run a Fifty test definition under a browser:
 * `/fifty test.browser [--chrome:data pathname] [--base pathname] file.fifty.ts [--part part] [--interactive] [--chrome:debug:vscode]`
 *
 * This invokes the underlying `tools/fifty/test-browser.jsh.js` script. The
 * script itself, included below, defines the semantics of the command-line arguments.
 *
 * {@includeCode ./test-browser.jsh.js}
 *
 * ### Running Fifty tests in both `jsh` and a browser
 *
 * To run a test suite that runs the same definition in both `jsh` and a browser, just invoke the `fifty.test.platforms()` method,
 * which will create a test named `platforms` that runs the `suite` test in both `jsh` and a browser.
 *
 * Then, the suite can be run via:
 *
 * `./fifty test.jsh file.fifty.ts --part platforms`.
 *
 * This will run the platforms test under `jsh`, which first runs the suite under `jsh`, then launches a browser to run it
 * again. See {@link slime.fifty.test.Kit}, specifically the `test.platforms` method.
 */
namespace slime.fifty.test {
	export type verify = slime.definition.verify.Verify

	export type tests = {
		[x: string]: any
	}

	/**
	 * Executes a test part from another file. The version that takes a third argument allows an argument of that type
	 * to be created and passed to the test part. This can be used so that Fifty test files can define
	 * conformance tests for a type and Fifty tests that provide implementations of that type can pass them as arguments
	 * to those tests.
	 *
	 * The other form simply executes an arbitrary test part, defaulting to the entire suite (the `suite` part) for the
	 * indicated file.
	 */
	export interface load {
		/**
		 * Executes a test part from another file that accepts an argument.
		 */
		<T>(path: string, part: string, t: T)

		/**
		 * Executes a test part from another file. Defaults to the `suite` part.
		 */
		(path: string, part?: string)
	}

	export interface MultiplatformTest {
		(): void
		jsh?: () => void
		browser?: () => void
	}

	/**
	 * The variable that appears as `fifty` within the scope of Fifty definition files when executing tests.
	 */
	export interface Kit {
		/**
		 * A function that can be used to create subjects and make assertions about them. See {@link slime.definition.verify.Verify}.
		 */
		verify: verify
		$loader: slime.old.Loader
		run: (f: () => void, name?: string) => void

		test: {
			/**
			 * Creates a test that simply loops through its own properties (and if its properties are objects, those properties'
			 * properties, recursively) and executes those as tests. Can be used to easily create a test hierarchy without
			 * having to have the parent repeat the names of all its children.
			 */
			Parent: () => () => void

			/**
			 * Creates a test whose implementation runs the tests specified in the `jsh` member and then launches
			 * the tests specified in the `browser` member in the browser. Also creates `.jsh` and `.browser` tests under the given
			 * name so that the platform suites can be run individually.
			 */
			multiplatform: (p: {
				name: string
				jsh?: () => void
				browser?: () => void
			}) => void

			/**
			 * A multiplatform test that runs the `suite` test under both `jsh` and the browser.
			 */
			platforms: () => void
		}

		evaluate: {
			create: <T,R>(
				f: (t: T) => R,
				string: string
			) => (t: T) => R
		}

		tests: tests

		/**
		 * Allows a Fifty test file to execute test parts from other files.
		 */
		load: load

		/**
		 * Provides access to Fifty global constructs for this execution. `$platform` and `$api` are available. If running under
		 * `jsh`, the `jsh` global is available as the `jsh` property. If running in the browser, the global `window` property is
		 * available, as well as a global `customElements` that can be used to register custom element constructors and bind them
		 * to a particular custom element name.
		 */
		global: {
			$platform: slime.runtime.Platform
			$api: slime.$api.Global
			jsh?: slime.jsh.Global
			window?: Window

			customElements?: {
				register: (factory: CustomElementConstructor) => void
			}
		}

		promises: slime.definition.test.promises.Export

		$api: {
			Events: {
				/**
				 * Creates a {@link slime.$api.event.Handlers} that captures and stores all received {@link slime.$api.Event}s for querying.
				 */
				Captor: <T>(t: T) => {
					events: $api.Event<any>[],
					handler: Required<$api.event.Handlers<T>>
				}
			}
		}

		jsh?: kit.Jsh
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.test = {};

			fifty.tests.test.jsh = function() {
				var relative = fifty.jsh.file.relative("../..");
				verify(relative).pathname.is(jsh.shell.jsh.src.pathname.toString());

				var temporary = fifty.jsh.file.temporary.location();
				//	TODO	normal verify chaining didn't work for exists()(), second invocation result is not wrapped
				verify(temporary).evaluate(function(p) { return p.file.exists()(); }).is(false);
				verify(temporary).evaluate(function(p) { return p.directory.exists()(); }).is(false);

				var object = fifty.jsh.file.object.getRelativePath("../..");
				verify(object).evaluate(function(p) { return p.toString(); }).is(jsh.shell.jsh.src.pathname.toString());
			}

			fifty.tests.suite = function() {
				if (jsh) {
					fifty.run(fifty.tests.test.jsh);
				}
			}
		}
	//@ts-ignore
	)($fifty)
}


/**
 * Contains constructs that support the Fifty test implementation.
 *
 * Note that general Fifty implementation documentation can be reached through the {@link slime.fifty.internal | `slime.fifty.internal`} namespace.
 *
 * Namespaces:
 * * The {@link slime.fifty.test.internal.scope | `scope`} namespace contains supporting definitions for {@link slime.fifty.test.Kit}.
 * * The {@link slime.fifty.test.internal.test | `test`} namespace contains definitions for `test.js`.
 */
namespace slime.fifty.test.internal {
	export interface Scope {
		success: boolean

		depth(): number
		fail(): void

		start: (name: string) => void
		test: slime.definition.verify.Context
		end: (name: string, result: boolean) => void
	}

	/**
	 * A destination to which test results and progress are sent.
	 */
	export interface Listener {
		start: (scope: Scope, name: string) => void
		test: (scope: Scope, message: string, result: boolean) => void
		end: (scope: Scope, name: string, result: boolean) => void
	}

	export type run = slime.fifty.test.internal.test.Exports["run"]
}

namespace slime.fifty.test.internal.test {
	export interface Context {
		library: {
			Verify: slime.definition.verify.Export
		}

		console: slime.fifty.test.internal.Listener

		jsh?: {
			global: slime.jsh.Global
			scope: slime.fifty.test.internal.scope.jsh.Export
		}

		window?: {
			global: Window & { console: typeof globalThis["console"] }
		}

		promises?: slime.definition.test.promises.Export
	}

	export type Result = {
		then: (f: (success: boolean) => any) => any
	}

	export interface Manifest {
		test: boolean
		children: {
			[x: string]: Manifest
		}
	}

	export interface AsynchronousScope {
		start: () => void
		then: (v: any) => any
		child: () => AsynchronousScope
		wait: () => Promise<any>
		now: () => Promise<any>

		test: {
			log: (...a: any[]) => void
			depth: () => number
			setName: (value: string) => void
		}
	}

	export interface AsynchronousScopes {
		push: () => AsynchronousScope
		pop: () => void
		current: () => AsynchronousScope
	}

	export interface Exports {
		/**
		 * Executes a Fifty page at the given path from the given loader, optionally limiting the test to a single part.
		 */
		run: (p: {
			loader: slime.old.Loader
			scopes: {
				jsh?: {
					directory: slime.jrunscript.file.Directory
					loader: slime.old.Loader
				}
			}
			path: string
			part?: string
		}) => Result

		list: (p: {
			loader: slime.old.Loader
			scopes: {
				jsh?: {
					directory: slime.jrunscript.file.Directory
					loader: slime.old.Loader
				}
			}
			path: string
		}) => Manifest
	}

	export type Script = slime.loader.Script<Context,Exports>
}
