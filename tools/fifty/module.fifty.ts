//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * **Fifty** is an authoring framework for SLIME _definitions_: constructs containing both documentation and tests.
 *
 * ## Fifty definitions: authoring documentation
 *
 * Fifty uses the {@link https://tsdoc.org/ | TSDoc } documentation format, and its results are published using
 * {@link https://github.com/TypeStrong/typedoc | TypeDoc }.
 *
 * ## Fifty definitions: uthoring tests
 *
 * Fifty provides an API for {@link slime.fifty.test | authoring tests} right in the middle of TypeScript definitions.
 *
 * ## Serving documentation: `fifty view`
 *
 * Fifty also allows SLIME-based projects to generate and serve their own documentation (interleaved with SLIME's, if SLIME is
 * included in the TypeScript project) via the `fifty view` command.
 *
 * `fifty view` serves the documentation for a project, in a dedicated Chrome browser if Chrome is found. Typedoc documentation will
 * be generated if necessary and served for both the top-level repository and subrepositories at `local/doc/typedoc` (it will be
 * re-generated for each request if `--watch` is used).
 *
 * *  `--base *directory*`: top-level directory of the project; defaults to the current working directory.
 * *  `--host *hostname*`: hostname suffix to use in the browser's address bar when serving pages. If omitted, the script will provide a host name.
 * * `--index *path*`: relative path to the index page; defaults to `README.html`.
 * *  `--watch`: if present, causes documentation to be re-generated for every HTML page requested; helpful when authoring docunmentation.
 * *  `--chrome:id *name*`: the private Chrome directory to use (under `local/chrome`); defaults to `documentation`, or `document` if `--watch` is set).
 *
 * ### Embedding `fifty view`
 *
 * Some projects might benefit from a more flexible Fifty UI; an alternative to `fifty view` is to embed its documentation in a
 * SLIME application. The following APIs can be used as building blocks:
 *
 * * The {@link slime.tools.documentation | Documentation API } provides a SLIME servlet handler implementation that serves
 * documentation.
 * * The {@link slime.jsh.Global#ui | `jsh.ui`} API provides the ablity to launch SLIME applications with a UI, and can incorporate the
 * documentation servlet handler implementation defined above.
 */
namespace slime.fifty {
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
	 * `./fifty test.jsh [--debug:rhino] file.fifty.ts [--part part]`
	 *
	 * ### Running Fifty tests in a browser
	 *
	 * To run a Fifty test definition under a browser:
	 * `/fifty test.browser [--interactive] [--chrome:data pathname] [--chrome:debug:vscode] file.fifty.ts [--part part]`
	 *
	 * This invokes the underlying `tools/fifty/test-browser.jsh.js` script. The
	 * [script's code](../src/tools/fifty/test-browser.jsh.js?as=text) defines the semantics of the
	 * command-line arguments.
	 *
	 * ### Running Fifty tests in both `jsh` and a browser
	 *
	 * To run a test suite that runs the same definition in both `jsh` and a browser:
	 *
	 * First, make sure the test suite defines a test - that runs under `jsh` only - using `fifty.jsh.platforms` (usually named
	 * `fifty.tests.platforms` by convention), like this one:
	 *
	 * `if (fifty.jsh) fifty.tests.platforms = fifty.jsh.platforms(fifty);`
	 *
	 * Then, the suite can be run via:
	 *
	 * `./fifty test.jsh file.fifty.ts --part platforms`.
	 *
	 * This will run the platforms test under `jsh`, which first runs the suite under `jsh`, then launches a browser to run it
	 * again. See {@link slime.fifty.test.Kit}, specifically the `jsh.platforms` method.
	 */
	export namespace test {
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

			global: {
				$api: slime.$api.Global
				jsh?: slime.jsh.Global
				window?: Window
			},
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
			},
			jsh?: {
				$slime: jsh.plugin.$slime
				file: {
					/**
					 * Returns a filesystem pathname corresponding to the given relative path, relative to the currently executing
					 * file.
					 */
					relative: (path: string) => slime.jrunscript.file.world.Location

					temporary: {
						location: () => slime.jrunscript.file.world.object.Location
						directory: () => slime.jrunscript.file.world.object.Location
					}

					object: {
						getRelativePath: (p: string) => slime.jrunscript.file.Pathname
						temporary: {
							location: () => slime.jrunscript.file.Pathname
							directory: () => slime.jrunscript.file.Directory
						}
					}
				}
				plugin: {
					/**
					 * Allows a test to load `jsh` plugins into a mock shell. Loads plugins from the same directory as the
					 * shell, optionally specifying the global object, `jsh`, and the shared `plugins` object used by the jsh plugin
					 * loader.
					 */
					mock: (p: {
						global?: { [x: string]: any }
						jsh?: { [x: string]: any }
						plugins?: { [x: string]: any }
						$slime?: slime.jsh.plugin.$slime
					}) => ReturnType<slime.jsh.loader.internal.plugins.Export["mock"]>
				},
				/**
				 * Creates a test that will run the test suite (the `suite` part) under `jsh`, and then again under the browser,
				 * and pass only if both parts pass.
				 */
				platforms: (fifty: Kit) => void
			}
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

				fifty.tests.test.suite = function() {
					if (jsh) {
						fifty.run(fifty.tests.test.jsh);
					}
				}
			}
		//@ts-ignore
		)($fifty)

		export namespace internal {
			export interface Console {
				start: (scope: Scope, name: string) => void
				test: (scope: Scope, message: string, result: boolean) => void
				end: (scope: Scope, name: string, result: boolean) => void
			}
		}
	}

	/**
	 * Types related to a **currently-inactive** project to build a custom UI for serving Fifty definitions (and perhaps running their
	 * tests). See {@link https://github.com/davidpcaldwell/slime/projects/11 | the closed GitHub project}.
	 */
	export namespace ui {
		export interface Exports {
			ast: (p: { node: { script: slime.jrunscript.file.Pathname, debug?: boolean }, ast: slime.jrunscript.file.Pathname, file: slime.jrunscript.file.Pathname }) => object

			interpret: (p: { ast: object }) => object
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.test.suite);
			}
		}
	//@ts-ignore
	)($fifty);
}
