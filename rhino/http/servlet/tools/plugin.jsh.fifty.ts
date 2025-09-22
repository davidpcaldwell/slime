//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.httpd {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Build {
		destination: {
			/**
			 * (optional; if omitted, a temporary directory will be used)
			 */
			directory?: slime.jrunscript.file.Directory

			war?: slime.jrunscript.file.Pathname
		}

		/**
		 * If `true`, causes the copy of Rhino from the current shell to be bundled with the application.
		 */
		rhino: boolean

		/**
		 * (optional; if not provided, no libraries will be bundled) An object whose properties are library file names and whose
		 * values are `file` objects representing the libraries.
		 */
		libraries?: {
			[x: string]: {
				copy(pathname: slime.jrunscript.file.Pathname, mode: { recursive: boolean })
			}
		}

		java?: {
			/**
			 * The Java version to use for `-source` and `-target` when compiling code.
			 */
			version?: string
		}

		/**
		 * Java source files to compile and include.
		 */
		compile?: slime.jrunscript.file.File[]

		/**
		 * An object whose properties are servlet parameter names and whose values are the values of the corresponding parameters.
		 */
		parameters?: {
			[x: string]: string
		}

		/**
		 * The webapp path to the servlet
		 */
		servlet: string

		Resources: (this: slime.jsh.httpd.Resources) => void
	}

	export namespace tools.test {
		export interface Exports {
			getWebXml: (p: Pick<Build,"servlet"|"parameters">) => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			//	TODO	this API is weird; is it smart?
			jsh.httpd.plugin.tools();
			const subject = jsh.httpd.tools;

			fifty.tests.manual.getWebXml = function() {
				jsh.shell.console("subject = " + subject);
				var webxml = subject.test.getWebXml({
					servlet: "WEB-INF/path/to/servlet.js",
					parameters: {
						foo: "bar",
						baz: "bizzy"
					}
				});
				jsh.shell.console(webxml);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {

	}

	export interface Exports {
		//	TODO	based on old TODO comment, there is probably no test for creating a `.war` and then running it to make sure it
		//			works
		/**
		 * A module allowing for, among other things, servlet applications to be compiled into `.war` files.
		 *
		 * The `jsh.httpd.tools` plugin is not available by default in a `jsh` shell; it must be loaded via a call to
		 * `jsh.httpd.plugin.tools()`.
		 */
		tools: {
			getJavaSourceFiles: (p: slime.jrunscript.file.Pathname) => slime.jrunscript.file.File[]

			build: slime.$api.fp.impure.Effect<Build>

			proxy: slime.servlet.proxy.Exports

			test: tools.test.Exports
		}
	}
}
