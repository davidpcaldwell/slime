//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * **Fifty** is an authoring framework for SLIME _definitions_: constructs containing both documentation and tests. Fifty uses
 * the {@link https://tsdoc.org/ | TSDoc } documentation format, and its results are published using
 * {@link https://github.com/TypeStrong/typedoc | TypeDoc }.
 *
 * Fifty provides an API for {@link slime.fifty.test | authoring tests} right in the middle of TypeScript definitions.
 */
namespace slime.fifty {
	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * Fifty allows tests to be embedded in TypeScript definitions.
	 *
	 * It does so by providing tools that
	 * execute definitions (in both the browser and using the {@link slime.jsh | `jsh`} shell) providing a scope variable to the
	 * tests called {@link slime.fifty.test.kit | `fifty` } allowing tests to be defined.
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
	 * For details, see the documentation on {@link slime.fifty.test.kit | the `fifty` object}.
	 */
	export namespace test {
		export type verify = slime.definition.verify.Verify

		export type $loader = slime.Loader & {
			//	will return a Pathname in jsh, but what in browser?
			getRelativePath: (p: string) => any

			/**
			 * Present if Fifty is being run in a `jsh` shell; provides the ability to load `jsh` plugins into a mock shell.
			 */
			jsh?: {
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
				$slime: jsh.plugin.$slime
			}
		}

		export interface run {
			(f: () => void, name: string): void
			(f: () => void): void
		}

		export type tests = any

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
		export interface kit {
			/**
			 * A function that can be used to create subjects and make assertions about them. See {@link slime.definition.verify.Verify}.
			 */
			verify: verify
			$loader: $loader
			run: run
			tests: tests

			/**
			 * Allows a Fifty test file to execute test parts from other files.
			 */
			load: load

			global: {
				jsh?: slime.jsh.Global
				$api: slime.$api.Global
				window?: Window
			},
			$api: {
				Function: slime.$api.Global["Function"]
				Events: {
					/**
					 * Creates an [[$api.Events.Handler]] that captures and stores all received [[$api.Event]]s for querying.
					 */
					Captor: <T>(t: T) => {
						events: $api.Event<any>[],
						handler: Required<$api.events.Handler<T>>
					}
				}
			},
			jsh?: {
				$slime: jsh.plugin.$slime
				file: {
					location: () => slime.jrunscript.file.Pathname
					directory: () => slime.jrunscript.file.Directory
				}
			}
		}

		export namespace internal {
			export interface Console {
				start: (scope: Scope, name: string) => void
				test: (scope: Scope, message: string, result: boolean) => void
				end: (scope: Scope, name: string, result: boolean) => void
			}

			export interface Scope {
				success: boolean

				depth(): number
				fail(): void

				start: (name: string) => void
				test: slime.definition.verify.Context
				end: (name: string, result: boolean) => void
			}

			export type run = (loader: slime.fifty.test.$loader, path: string, part?: string) => boolean
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
}