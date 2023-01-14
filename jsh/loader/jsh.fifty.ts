//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export namespace loader {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.loader = {};
				fifty.tests.loader.exports = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		/**
		 * A script to be executed. Can be a {@link slime.resource.Descriptor} which fully describes the code to be executed, but
		 * also can be specified using several other types. If the value is a {@link slime.jrunscript.file.Pathname}, the script
		 * will be read from that location in the file system. If the value is a {@link slime.jrunscript.file.File}, the script
		 * will be read from that file. If it is a {@link slime.web.Url}, it will be loaded over HTTP. And if it is a
		 * `string`, the loader will:
		 * * See whether it "looks like" a URL, and if so, try to load the script over HTTP,
		 * * See whether it represents an absolute path on the filesystem, and if so, load the code from that file,
		 * * Otherwise, treat it as a path relative to the main script (see {@link slime.jsh.script}) and try to load it from there.
		 */
		export type Code = slime.resource.Descriptor | slime.jrunscript.file.Pathname | slime.jrunscript.file.File | slime.web.Url | string

		export interface Exports {
			run: (code: Code, scope?: { [name: string]: any }, target?: object) => void
			value: (code: Code, scope?: { [name: string]: any }, target?: object) => any
			file: (code: Code, context?: { [name: string]: any }, target?: object) => any
			module: (code: Code | slime.jrunscript.file.Directory | slime.web.Url, context?: { [name: string]: any }, target?: object) => any
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var verify = fifty.verify;
				var jsh = fifty.global.jsh;

				type exports = { foo: string }

				type pathsExports = { a: number }
				type pathsFileExports = { value: string }

				fifty.tests.loader.exports.module = function() {
					var byFullPathname: exports = jsh.loader.module(fifty.jsh.file.object.getRelativePath("test/code/module.js"));
					verify(byFullPathname).foo.is("bar");

					var byModulePathname: exports = jsh.loader.module(fifty.jsh.file.object.getRelativePath("test/code"));
					verify(byModulePathname).foo.is("bar");

					var byModuleFile: exports = jsh.loader.module(fifty.jsh.file.object.getRelativePath("test/code/module.js").file);
					verify(byModuleFile).foo.is("bar");

					var byModuleDirectory: exports = jsh.loader.module(fifty.jsh.file.object.getRelativePath("test/code").directory);
					verify(byModuleDirectory).foo.is("bar");

					var paths: {
						module: {
							pathname: pathsExports
							relative: pathsExports
							absolute: pathsExports
							http: { base: pathsExports, file: pathsExports }
							url: { base: pathsExports, file: pathsExports }
						},
						file: {
							pathname: pathsFileExports
							relative: pathsFileExports
							absolute: pathsFileExports
							http: pathsFileExports
							url: pathsFileExports
						}
					} = (function() {
						var result = jsh.shell.jsh({
							shell: jsh.shell.jsh.src,
							script: fifty.jsh.file.object.getRelativePath("test/jsh-loader-code/main.jsh.js").file,
							stdio: {
								output: String
							}
						});
						return JSON.parse(result.stdio.output);
					})();
					verify(paths).module.pathname.a.is(2);
					verify(paths).module.relative.a.is(2);
					verify(paths).module.absolute.a.is(2);
					verify(paths).module.http.base.a.is(2);
					verify(paths).module.http.file.a.is(2);
					verify(paths).module.url.base.a.is(2);
					verify(paths).module.url.file.a.is(2);

					verify(paths).file.pathname.value.is("kindness");
					verify(paths).file.relative.value.is("kindness");
					verify(paths).file.absolute.value.is("kindness");
					verify(paths).file.http.value.is("kindness");
					verify(paths).file.url.value.is("kindness");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/**
			 * Loads `jsh` plugins from a given location.
			 */
			plugins: (p: slime.jrunscript.file.Directory | slime.jrunscript.file.Pathname | slime.Loader) => void
			addFinalizer: any
			java: {
				toString: () => string
				add: (pathname: slime.jrunscript.file.Pathname) => void
				getClass: (name: any) => any
			}
			worker: any
			kotlin: {
				/**
				 * **Experimental** Runs the given Kotlin script under the given bindings. See `jsh/test/manual/kotlin-jsr-223.jsh.js`
				 * for an example. Kotlin must first be installed via `jsh/tools/install/kotlin.jsh.js`.
				 */
				run: (
					program: slime.jrunscript.file.File,
					/**
					 * A set of bindings that will be made visible to the script.
					 */
					bindings: {
						[x: string]: any
					}
				) => any
			}
			synchronous: slime.runtime.loader.Exports["synchronous"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var global = function(built: boolean) {
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					{
						command: "bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push("jsh.bash");
							if (built) rv.push("jsh/test/tools/run-in-built-shell.jsh.js");
							rv.push("jsh/loader/test/global-scope.jsh.js");
							return rv;
						}),
						stdio: {
							output: "string"
						},
						directory: jsh.shell.jsh.src.toString()
					}
				);
				verify(result).status.is(0);
				jsh.shell.console(result.stdio.output);
				var json = JSON.parse(result.stdio.output) as string[];
				verify(json).length.is(1);
				verify(json)[0].is("jsh");
			};

			var plugin = function() {
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					{
						command: "bash",
						arguments: $api.Array.build(function(rv: string[]) {
							rv.push("jsh.bash");
							rv.push("jsh/loader/test/plugin-scope.jsh.js");
							return rv;
						}),
						stdio: {
							output: "string"
						},
						directory: jsh.shell.jsh.src.toString()
					}
				);
				verify(result).status.is(0);
				jsh.shell.console(result.stdio.output);
				var json = JSON.parse(result.stdio.output) as { $host: string };
				verify(json).$host.is("undefined");
			};

			fifty.tests.scope = function() {
				global(false);
				global(true);
				plugin();
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.scope);
				fifty.run(fifty.tests.loader.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Global {
		loader: slime.jsh.loader.Exports
	}
}

namespace slime.jsh.plugin {
	export interface EngineSpecific {
		//	provided by engine-specific rhino.js and nashorn.js
		exit: any
		jsh: any
	}

	export interface Stdio {
		getStandardInput(): slime.jrunscript.native.java.io.InputStream
		getStandardOutput(): slime.jrunscript.native.java.io.PrintStream
		getStandardError(): slime.jrunscript.native.java.io.PrintStream
	}

	export interface $slime extends slime.jrunscript.runtime.Exports, EngineSpecific {
		getSystemProperty(name: string): string
		getEnvironment(): slime.jrunscript.native.inonit.system.OperatingSystem.Environment
		getInvocation(): slime.jrunscript.native.inonit.script.jsh.Shell.Invocation

		getPackaged(): slime.jrunscript.native.inonit.script.jsh.Shell.Packaged

		plugins: {
			mock: slime.jsh.loader.internal.plugins.Export["mock"]
		}

		loader: slime.jrunscript.runtime.Exports["old"]["loader"]
			& slime.jrunscript.runtime.Exports["loader"]
			& {
				getLoaderScript(path: string): any
			}

		/**
		 * Returns a `java.io.File` representing a file location relative to the `jsh` library location.
		 *
		 * @param path A relative path.
		 */
		getLibraryFile: (path: string) => slime.jrunscript.native.java.io.File
		getInterface(): any
		getSystemProperties(): slime.jrunscript.native.java.util.Properties
		getStdio(): Stdio
	}
}
