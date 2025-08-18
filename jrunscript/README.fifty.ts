//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Two major SLIME embeddings use the jrunscript runtime: {@link slime.jsh | `jsh`}, which uses JVM-based JavaScript to write arbitrary
 * applications, and {@link slime.servlet | SLIME Servlets}, which provides the ability to deploy SLIME code in a servlet container.
 *
 * There are many SLIME modules which are compatible with both embeddings; access to those modules is provided in embedding-specific
 * ways, so consult the embeddings for details.
 *
 * ## Java stream I/O support: {@link slime.jrunscript.runtime.io.Exports `$api.jrunscript.io`}
 *
 * The module that supports Java stream I/O, {@link slime.jrunscript.runtime.io}, is available as `$api.jrunscript.io`, which provides the
 * {@link slime.runtime.io.Exports} in Java-based
 * embeddings.
 *
 * ## Other modules
 *
 * Many other modules are written for the jrunscript environment. See the embedding you are using, like `jsh` or SLIME Servlets,
 * for details on how to access them.
 *
 * ### Java integration
 *
 * Documentation for the module at `jrunscript/host` which provides for interacting with the Java host environment
 * {@link slime.jrunscript.java} namespace.
 *
 * ### Java tools (`javac`, `jar`)
 *
 * Documentation for the module at `rhino/tools` that allows interaction with Java-specific tools like `javac` and `jar` (and their
 * embedded equivalents) can be found in the {@link slime.jrunscript.java.tools java.tools} namespace.
 *
 * ## Embedding: {@link slime.jrunscript.runtime | SLIME Java runtime}
 *
 * The SLIME Java runtime can be embedded within Java environments. Two embeddings are supplied:
 *
 * * A servlet-based embedding
 * * An embedding for `jsh` scripts.
 *
 * Additional Java embeddings can be created. The basic way the existing embeddings are implemented is by providing an appropriate
 * JavaScript scope and then executing a JavaScript-engine-specific script, which in turn provides an engine-specific scope to the
 * jrunscript runtime. This process is not documented but can be examined in the `jsh` embedding via the `jrunscript/jsh/loader`
 * directory and for the servlet embedding in the `rhino/http/servlet` directory.
 *
 */
namespace slime.jrunscript {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api } = fifty.global;

			fifty.tests.$api = fifty.test.Parent();

			if (fifty.global.jsh) {
				fifty.tests.$api.jrunscript = fifty.test.Parent();

				fifty.tests.$api.jrunscript.io = function() {
					verify($api).evaluate.property("jrunscript").is.type("object");
					verify($api).evaluate.property("jrunscript").evaluate.property("io").is.type("object");
				}
			}
		}
	//@ts-ignore
	)(fifty);
}
