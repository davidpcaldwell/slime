//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## `jsh` documentation
 *
 * Documentation about contributing to `jsh` can be browsed at the {@link slime.jsh.internal slime.jsh.internal} TypeScript
 * namespace.
 *
 * ## Compatibility updates
 *
 * ### Java
 *
 * SLIME manages Java VMs based on Amazon Corretto (though it can be configured to run under any JDK). Corretto end of life
 * information is available at [https://endoflife.date/amazon-corretto](https://endoflife.date/amazon-corretto).
 *
 * ### TypeScript
 *
 * To update TypeScript, update the version in `tools/wf/typescript.js`, and make sure that there is a compatible TypeDoc version
 * declared for that version.
 *
 * ### TypeDoc
 *
 * To update TypeDoc, map the desired TypeScript version to updated TypeDoc versions in `tools/wf/typescript.js`.
 *
 * ### Node.js
 *
 * To update Node.js, update the version in `rhino/tools/node/module.js`.
 *
 * ### Docker
 *
 * To update the Docker API type definitions, update the URL in `rhino/tools/docker/tools/types.jsh.js` to specify the new
 * OpenAPI YAML, then run the `rhino/tools/docker/tools/types.jsh.js`, which will emit a new
 * `rhino/tools/docker/tools/docker-api.d.ts`.
 *
 * ### Javassist
 *
 * Used in the Rhino profiler, it can be updated by editing the download URL in `rhino/tools/profiler/build.jsh.js`.
 *
 * ## Testing
 *
 * ### Continuous integration
 *
 * Testing is done via GitHub Actions, whose configuration is specified in the `.github` directory.
 *
 * Currently, the GitHub Actions use an older approach to test suite management; they essentially run a single command designed to
 * test the entire project on a given platform, where a platform includes:
 *
 * * For macOS
 *     * Java 21
 *
 * * For Linux
 *     * A version of Java
 *     * Chrome
 *     * Firefox
 *
 * The test suite should be broken up into better-defined segments; each platform combination should be a separate job, but that
 * would take some reorganization (and simultaneously the project is
 * [being transitioned](https://github.com/users/davidpcaldwell/projects/21) from the older JSAPI framework to the Fifty definition
 * framework, complicating matters.)
 *
 * Generally speaking, a specific GitHub action is specified by:
 *
 * * The top-level GitHub YAML file, which invokes:
 * * `contributor/suite-[platform]`, which invokes:
 * * `./wf check` (with `--docker` for Docker test environments), which invokes:
 *     * the linter
 *     * the TypeScript compiler
 *     * Rhino installation into the shell
 *     * the test suite at `contributor/suite.jsh.js` (passing through the Docker flag if it was present on `./wf check`)
 * * The test suite:
 *     * Installs Tomcat and TypeScript
 *     * If running in Docker, installs Selenium
 *     * Runs a suite of tests designed to test all available JavaScript engines, implemented in `contributor/jrunscript-engines.jsh.js`
 *     * Runs a suite of tests using a single engine (designed to test the `jrunscript`-based API at `contributor/jrunscript.jsh.js`)
 *     * If on Docker, runs Selenium tests on the Chrome and Firefox browsers
 *     * Runs a very brief set of tests of the Node.js SLIME runtime
 *
 * ### Testing specific scenarios
 *
 * #### Creating fresh "clones" of the current source directory locally
 *
 * See {@link slime.jsh.wf.test.Fixtures}, specifically `clone()`, to set up mirrors of the current source code.
 *
 * #### Creating a fresh "clone" of the current source directory in Docker
 *
 * A new container hosting SLIME can be started via the following commands, with various configurations:
 *
 * * `test-docker-clean-run`: Starts a new container containing SLIME, with the source code mounted but excluding the `local`
 * directory, and logs you into the `local` service.
 * * `test-docker-clean-start`: Starts the SLIME development Docker Compose application, with the source code mounted in the
 * `local` container but excluding the `local` directory.
 * * `test-docker-clean-jsh <jdk-version> <script> [arguments]`: Creates a Docker image with the SLIME source code baked in (and an empty `local/` directory), as is
 * done in the CI environment, and runs a `jsh` script using the specified JDK (specified by the `JDK_VERSION` environment variable)
 * inside the container.
 *
 * ### Browser tests
 *
 * The containerized browser tests can be run from within the devcontainer:
 *
 * * Restart browser-specific container in Docker
 * * `./fifty test.browser --browser dockercompose:selenium:chrome contributor/browser.fifty.ts --interactive`
 * * Go to appropriate VNC port using HTTP to get a VNC client and use `secret` as the password
 *
 * ## Documentation
 *
 * ### Namespaces split across multiple files
 *
 * For namespace comments TypeDoc will handle namespaces split across multiple files by using, it seems, the longest comment
 * declaring the namespace; see [GitHub issue](https://github.com/TypeStrong/typedoc/issues/1855).
 *
 * For namespaces split across multiple files, SLIME adopts a convention of creating a file called `_.fifty.ts`
 * to contain simply a namespace declaration and the top-level namespace comment, to try to eliminate guesswork about which
 * file should contain the namespace comment.
 *
 * ## Tools
 *
 * The `contributor/code/find-untyped-usages.jsh.js` script can be used to search the SLIME codebase for usages of a particular
 * construct in files without typechecking (where a standard usages search might not find them, in other words).
 */
namespace slime.internal {

}
