//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * **Fifty** is an authoring framework for SLIME _definitions_: constructs containing both documentation and tests.
 *
 * The documentation is created using ordinary TypeScript type definitions, along with {@link https://tsdoc.org/ | TSDoc}
 * documentation.[<sup>(details)</sup>](#format)
 *
 * Tests are created by writing inline TypeScript IIFEs which will be executed when tests are run.
 *
 * So with Fifty, tests that enforce behavior defined in the documentation can be placed directly adjacent to the documentation
 * itself.
 *
 * Here is a working example that uses various techniques (and functions as an automated test of Fifty itself):
 *
 * {@includeCode ./test/data/module.fifty.ts}
 *
 * ## Fifty definitions: authoring documentation
 *
 * Fifty uses the {@link https://tsdoc.org/ | TSDoc} documentation format, and its results are published using
 * {@link https://github.com/TypeStrong/typedoc | TypeDoc}.
 *
 * ## Fifty definitions: authoring tests
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
 * * `--base <directory>`: top-level directory of the project; defaults to the current working directory.
 * * `--host <hostname>`: hostname suffix to use in the browser's address bar when serving pages. If omitted, the script will provide a host name.
 * * `--index <path>`: relative path to the index page; defaults to `README.html`.
 * * `--watch`: if present, causes documentation to be re-generated for every HTML page requested; helpful when authoring docunmentation.
 * * `--chrome:id <name>`: the private Chrome directory to use (under `local/chrome`); defaults to `documentation`, or `document` if `--watch` is set).
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
 *
 * ### [TypeDoc](https://typedoc.org/) resources
 *
 * * [TSDoc advanced demo](https://github.com/microsoft/tsdoc/blob/master/api-demo/src/advancedDemo.ts)
 *
 * ## Notes
 *
 * * <a name="format"></a> Technically, since TypeDoc is used to generate the output, currently Fifty documentation can be written in any format
 * understood by TypeDoc. TypeDoc's documentation provides additional information about its support for
 * [JSDoc](https://typedoc.org/documents/Doc_Comments.JSDoc_Support.html)
 * and [TSDoc](https://typedoc.org/documents/Doc_Comments.TSDoc_Support.html).
 */
namespace slime.fifty {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.load("test.fifty.ts");
				fifty.load("view.fifty.ts");
				fifty.load("test/data/module.fifty.ts");
			}
		}
	//@ts-ignore
	)($fifty);
}
