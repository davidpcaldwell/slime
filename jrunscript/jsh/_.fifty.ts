//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * `jsh` is a shell environment which allows JavaScript programs to be written which execute in the Java virtual machine and thus
 * can interact with Java platform classes and libraries written in Java or other JVM languages.
 *
 * `jsh` scripts have access to the global `jsh` object, which is of type {@link Global}.
 *
 * ## Configuration
 *
 * See [running `jsh`](../src/jrunscript/jsh/launcher/api.html) for information about how to run scripts using `jsh` and configure the
 * shell.
 *
 * ## Execution models
 *
 * `jsh` supports three execution models: an "unbuilt" shell executed directly from source, a "built" shell in which `jsh`
 * components are preprocessed and deployed to support faster startup, and a "packaged" shell in which a `jsh` script is packaged
 * into a standalone executable JAR file.
 *
 * ### Unbuilt shells
 *
 * Unbuilt shells can be executed from a source checkout (or over the internet, directly from GitHub). They are executed by
 * invoking the `bash` launcher at `./jsh` in the source tree. Currently, only macOS and Linux are supported.
 *
 * ### Built shells
 *
 * A built shell can be created by executing the `jrunscript/jsh/etc/build.jsh.js` script.
 *
 * In built shells, the `bash` launcher is located at `./jsh.bash` in the build directory, and the native launcher (if specified)
 * is located at `./jsh`. Both launchers expect the Java binaries to be in the `PATH`.
 *
 * ### Packaged applications
 *
 * TODO write documentation
 *
 * ## Older documentation
 *
 * See [old JSAPI-based `jsh` documentation](../src/jsh/etc/api.html).
 */
namespace slime.jsh {
	namespace db.jdbc {
		interface Exports {
			//	interface is built out via Declaration Merging (https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
		}
	}

	export interface Tools {
		jenkins: slime.jrunscript.tools.jenkins.Exports
		node: slime.jrunscript.tools.node.Exports
		install: slime.jrunscript.tools.install.Exports
		github: slime.jrunscript.tools.github.Exports
	}

	/**
	 * The global `jsh` object provided by the `jsh` shell.
	 *
	 * All code loaded by `jsh` also has access to the `$api` global object; see [$api](slime._api.global.html).
	 */
	export interface Global {
		java: slime.jrunscript.java.Exports & {
			tools: slime.jsh.java.tools.Exports,
			log: any
		}

		tools: Tools & {
			/**
			 * @deprecated See {@link slime.jsh.shell.tools.Exports | slime.jsh.shell.tools.Exports.rhino }
			 */
			rhino: {}
			tomcat: {}
			ncdbg: {}
		}

		script: slime.jsh.script.Exports

		js: slime.js.old.Exports & {
			document: any
			web: slime.web.Exports
		}

		file: slime.jrunscript.file.Plugin
		time: slime.time.Exports
		ip: slime.jrunscript.ip.Exports
		db: {
			jdbc: slime.jsh.db.jdbc.Exports
		}
	}
}

/**
 * To execute a script in an ad-hoc built shell, execute:
 * `./jsh jrunscript/jsh/test/tools/run-in-built-shell.jsh.js <script> [arguments]`
 *
 * To execute a script in a packaged shell, execute:
 * `./jsh jrunscript/jsh/test/tools/run-in-built-shell.jsh.js -packaged <script> [arguments]`
 */
namespace slime.jsh.internal {

}
