//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * ## Provided Platforms
 *
 * ### Java
 *
 * SLIME's Java support allows applications to be written in JavaScript that call out to Java platform libraries. As such, it is an
 * ideal platform for migrating Java software toward JavaScript.
 *
 * Java-specific type definitions are provided in the {@link slime.jrunscript slime.jrunscript} namespace.
 *
 * SLIME provides two Java platforms: the `jsh` scripting platform that runs on the JVM, and the Java servlet platform that runs on
 * a standard Java servlet implementation. `jsh` also provides the ability to run a servlet container from within its shell.
 *
 * #### `jsh`
 *
 * {@link slime.jsh | `jsh`} is a JavaScript application environment that runs on, and can access, the Java platform.
 *
 * #### SLIME Servlets
 *
 * {@link slime.servlet | SLIME Servlets} is a JavaScript environment for authoring Java servlets.
 *
 * #### Compatibility
 *
 * The SLIME Java runtime is compatible with the following Java environments.
 *
 * ##### JDK
 *
 * The current goal is to be compatible with versions used by most Java developers. As of New Relic's
 * [2024 survey](https://newrelic.com/resources/report/2024-state-of-the-java-ecosystem#new-java-versions-being-adopted-faster),
 * **Java 17** was the leading version, with 35.4% of monitored applications using it. **Java 11** followed with 32.9%, and
 * **Java 8** was still used by 28.8%. SLIME is also tested against **Java 21**.
 *
 * ##### JVM JavaScript engine
 *
 * The test suite executes tests primarily with **Rhino {@include ./VERSIONS.md#rhino}**, with some tests for the **Nashorn** engine; for JDK versions
 * including Nashorn, the **built-in JDK 8-14 Nashorn** is used, while for JDK versions subsequent to Nashorn's removal, standalone
 * **Nashorn {@include ./VERSIONS.md#nashorn-standalone}** is used. **GraalVM** is not yet supported, although
 * [development is underway](https://github.com/davidpcaldwell/slime/projects/10).
 *
 * ##### Servlet containers
 *
 * SLIME Servlets is compatible with the Servlet 3.0.1 implementation.
 *
 * `jsh` currently uses the latest **Tomcat 9.0.x** and runs tests with it via the test suite.
 *
 * ### Browser
 *
 * {@link slime.browser | SLIME Browser} is a SLIME environment for the browser. Browser support is less mature than Java support,
 * but is currently tested in Google Chrome and Firefox.
 *
 * ### Node.js
 *
 * {@link slime.node | SLIME Node.js} is a SLIME environment for Node.js. Node.js support is new; currently, the Node environment
 * simply loads the low-level SLIME runtime (providing SLIME's object-oriented and functional programming APIs) and provides access
 * to it, as well as a simple filesystem-based {@link slime.Loader} implementation.
 *
 * ### ~~JXA~~ (currently broken; see [issue #1506](https://github.com/davidpcaldwell/slime/issues/1506))
 *
 * ~~{@link slime.jxa | SLIME JXA} is a SLIME environment for use in macOS automation.~~
 *
 * ~~JXA support is alpha quality. That said, JXA is a very difficult environment to use, so SLIME is already extremely helpful, as it
 * provides basic abilities not provided by the platform (like the ability to load code from other source files).~~
 *
 * ### Creating a custom embedding
 *
 * SLIME provides several embeddings (`jsh`, a Java servlet-based embedding, a browser embedding, a JXA embedding for macOS
 * automation), and a simple Node.js embedding.
 *
 * Custom SLIME embeddings may be developed by creating a suitable implementation of {@link slime.runtime.Scope} and putting that
 * object in scope when evaluating `loader/expression.js`, which yields an object of type {@link slime.runtime.Exports}.
 *
 * The SLIME {@link slime.runtime.Exports | runtime} provides APIs that are ordinarily not available to application code directly, but are
 * provided to support embedders (who can provide them, in turn, to application code).
 *
 * ## Using SLIME
 *
 * ### APIs for all platforms
 *
 * SLIME provides the {@link slime.$api.Global | `$api`} object to all code loaded with SLIME, which provides a number of
 * general-purpose constructs, including a functional programming module available as {@link slime.$api.fp.Exports | `$api.fp`}. A
 * low-level {@link slime.runtime.Platform | `$platform`} object is also provided to all code loaded; `$platform` may provide access
 * to engine-specific capabilities.
 *
 * ### SLIME definitions (documentation and testing): the `fifty` tool
 *
 * SLIME has the concept of a _definition_, which is a construct that provides both documentation and a test suite for a particular
 * software module.
 *
 * Documentation for SLIME itself is mostly contained in SLIME definitions that define its APIs.
 *
 * SLIME definitions are created via the {@link slime.fifty | Fifty definition framework}, which uses TypeScript to
 * provide type definitions and `tsdoc`-compatible documentation (and uses [TypeDoc](https://typedoc.org/) to publish that
 * documentation, and the {@link slime.fifty.view.cli.Program | `fifty view` tool} to serve it), and allows inline tests to be authored within those TypeScript
 * definitions. A simple example that contains tests for the project's `wf` commands can be found at `./wf.fifty.ts`.
 *
 * Fifty definition files are just TypeScript files that declare the types and exports available for an API. The `fifty` tool allows
 * tests that are embedded in those TypeScript files to be executed. See the {@link slime.fifty.test | Fifty testing documentation}
 * for details.
 *
 * #### Older SLIME documentation in HTML format
 *
 * A few SLIME APIs (about 14% as of this writing in 2024 Deceuber) continue to have their definitions maintained via the deprecated
 * JSAPI definition format, implemented in the `loader/api/old` folder, which used literate definitions that allowed documentation
 * and tests to be defined via annotated HTML (typically using the file extension `.api.html`), using HTML constructs for
 * documentation and embedded scripts for testing. This documentation is really only available by browsing the HTML files
 * themselves. Most JSAPI-described APIs also have Fifty API definitions, but the Fifty definitions may be less complete. Migration
 * of the remaining files is underway.
 *
 * ### SLIME projects: `wf`
 *
 * SLIME provides a tool called `wf` for automating tasks in the software development lifecycle. It provides standard
 * implementations of various commands that can be added to a project with some project-specific configuration; see {@link
 * slime.jsh.wf.Exports#project | `jsh.wf.project.initialize()`}. Custom `wf` commands can also be implemented, either from scratch or using
 * a provided `jsh` plugin {@link slime.jsh.wf.Exports | API}. See the `wf` {@link slime.jsh.wf | documentation} for more
 * information on setting up `wf` in a new project.
 *
 * ### Bundled tools and examples
 *
 * SLIME has several potentially useful programs bundled in its distribution
 *
 * #### Serve a directory (and optionally open a Chrome browser to browse it)
 *
 * In the context of SLIME development, one might serve a directory perhaps to make it easy to browse files, or maybe to support a
 * browser-only application.
 *
 * But this program is also a simple one-command web server that can be used for any purpose.
 *
 * It also serves as a useful example program if you want to design your own SLIME-based HTTP server.
 *
 * `./jsh.bash rhino/http/servlet/tools/serve.jsh.js [--chrome:data *location*] [--chrome:debug:port *number*] [--index
 * *path-to-index*] *directory*`
 *
 * *  `--chrome:data *location*`: Chrome will be opened to browse the directory, starting at the path specified by `--index`.
 * *  `--chrome:debug:port *number*`: If specified, the opened Chrome will allow debuggers to connect on the given port.
 * *  `--index *path-to-index*`: (optional; defaults to `index.html`) The relative path of the index page in the directory being served.
 * *  `*directory*`: A directory to serve.
 *
 * ## Contributor documentation
 *
 * Separate documentation for project contributors can be browsed as the {@link slime.internal} TypeScript namespace.
 */
namespace slime {
	export interface Codec<T,E> {
		encode: (t: T) => E
		decode: (e: E) => T
	}

	export namespace js {
		export type NotReadonly<T> = T extends Object ? { -readonly [K in keyof T]: T[K] } : T

		export type Cast<T> = (p: any) => T

		//	https://stackoverflow.com/questions/41253310/typescript-retrieve-element-type-information-from-array-type
		export type ArrayElement<ArrayType extends readonly unknown[]> =
			ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
	}
}
