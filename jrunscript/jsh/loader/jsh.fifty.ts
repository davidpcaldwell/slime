//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export namespace plugin {
		export interface $slime {
			loader:
				slime.jrunscript.runtime.Exports["old"]["loader"]
				& slime.jrunscript.runtime.Exports["loader"]
				& {
					getLoaderScript(path: string): any
				}
		}
	}

	export namespace loader {
		/**
		 * The `jsh` loader, exposed to scripts as `jsh.loader`, wraps the {@link slime.jrunscript.runtime.Exports | SLIME Java
		 * runtime} which in turn augments the {@link slime.runtime.Exports | SLIME runtime}.
		 */
		export interface Exports {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		/**
		 * A script to be executed. Can be a {@link slime.resource.Descriptor} which fully describes the code to be executed, but
		 * also can be specified using several other types.
		 *
		 * * If the value is a {@link slime.jrunscript.file.Pathname}, the script
		 * will be read from that location in the file system.
		 * * If the value is a {@link slime.jrunscript.file.File}, the script
		 * will be read from that file.
		 * * If it is a {@link slime.web.Url}, it will be loaded over HTTP.
		 * * And if it is a
		 * `string`, the loader will:
		 *     * See whether it "looks like" a URL, and if so, try to load the script over HTTP,
		 *     * See whether it represents an absolute path on the filesystem, and if so, load the code from that file,
		 *     * Otherwise, treat it as a path relative to the main script (see {@link slime.jsh.script}) and try to load it from there.
		 */
		export type Code = slime.resource.Descriptor | slime.jrunscript.file.Pathname | slime.jrunscript.file.File | slime.web.Url | string

		export interface Exports {
			/**
			 * Analogous to {@link slime.runtime.Exports | SLIME runtime's run()}, except that a {@link Code} is supplied as the
			 * first argument rather than a {@link slime.Resource}.
			 */
			run: (code: Code, scope?: { [name: string]: any }, target?: object) => void

			/**
			 * Analogous to {@link slime.runtime.Exports | SLIME runtime's value()}, except that a {@link Code} is supplied as the
			 * first argument rather than a {@link slime.Resource}.
			 */
			value: (code: Code, scope?: { [name: string]: any }, target?: object) => any

			/**
			 * Analogous to {@link slime.runtime.Exports | SLIME runtime's file()}, except that a {@link Code} is supplied as the
			 * first argument rather than a {@link slime.Resource}.
			 */
			file: (code: Code, context?: { [name: string]: any }, target?: object) => any

			//	TODO	check whether returning null is also a characteristic of the underlying method called
			/**
			 * Analogous to {@link slime.Loader}'s `module()`, except that the first argument can be a {@link Code}, a
			 * {@link slime.jrunscript.file.Directory}, or a {@link slime.web.Url}, rather than a path in an existing
			 * {@link slime.Loader}.
			 *
			 * @param code The location of the module. If the file is a directory, it is treated as the base of an unpacked module.
			 * If the file is a plain file, then if its name ends in `.slime`, it is treated as a packed module. Otherwise, the
			 * given file is treated as the main file of a module whose base is the directory in which the file is located.
			 *
			 * @returns `null` if the module cannot be found; otherwise, a value analogous to the return value of {@link
			 * slime.Loader}'s `module` method.
			 */
			module: (code: Code | slime.jrunscript.file.Directory | slime.web.Url, context?: { [name: string]: any }, target?: object) => any
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				var verify = fifty.verify;
				var $api = fifty.global.$api;
				var jsh = fifty.global.jsh;

				type exports = { foo: string }

				type pathsExports = { a: number }
				type pathsFileExports = { value: string }

				fifty.tests.exports.run = fifty.test.Parent();

				fifty.tests.exports.run.pathname = function() {
					var pathname = fifty.jsh.file.object.getRelativePath("test/jsh-loader-code/run.js");

					fifty.run(function object() {
						var code = pathname;
						var value: string;
						var scope = {
							$set: function(to) {
								value = to;
							}
						};
						jsh.loader.run(code, scope);
						verify(value).is("it");
					});

					fifty.run(function absolute() {
						var code = pathname.toString();
						var value: string;
						var scope = {
							$set: function(to) {
								value = to;
							}
						};
						jsh.loader.run(code, scope);
						verify(value).is("it");
					});

					fifty.run(function relative() {
						var code = "../../jrunscript/jsh/loader/test/jsh-loader-code/run.js";
						var value: string;
						var scope = {
							$set: function(to) {
								value = to;
							}
						};
						jsh.loader.run(code, scope);
						verify(value).is("it");
					});
				};

				fifty.tests.exports.run.file = function() {
					var code = fifty.jsh.file.object.getRelativePath("test/jsh-loader-code/run.js").file;
					var value: string;
					var scope = {
						$set: function(to) {
							value = to;
						}
					};
					jsh.loader.run(code, scope);
					verify(value).is("it");
				};

				fifty.tests.exports.run.url = function() {
					var server = jsh.httpd.Tomcat.serve({
						directory: fifty.jsh.file.object.getRelativePath(".").directory
					});

					const URL = "http://127.0.0.1:" + server.port + "/test/jsh-loader-code/run.js";

					fifty.run(function jshWebUrl() {
						var code = jsh.web.Url.parse(URL);
						var value: string;
						var scope = {
							$set: function(to) {
								value = to;
							}
						};
						debugger;
						jsh.loader.run(code, scope);
						verify(value).is("it");
					});

					fifty.run(function stringUrl() {
						var code = URL;
						var value: string;
						var scope = {
							$set: function(to) {
								value = to;
							}
						};
						jsh.loader.run(code, scope);
						verify(value).is("it");
					});
				}

				fifty.tests.exports.value = function() {
					var CODE = fifty.$loader.get("../../../loader/test/data/a/value.js").read(String);
					var Target = function() {
						this.description = "rsi";
						this.thisName = void(0);
					};
					var scope = {
						b: "battery"
					};
					var target = new Target();
					//	TODO	name is (erroneously?) required for Java-based loader
					var NAME = "foo.js";
					var descriptor: slime.resource.Descriptor = {
						name: NAME,
						read: {
							string: () => CODE
						}
					}
					var value: number = jsh.loader.value(descriptor, scope, target);
					verify(target).thisName.evaluate(String).is("rsi:battery");
					verify(value).is(5);
					var t2 = new Target();
					var FILE = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("a.js");
					FILE.write(CODE, { append: false });
					var v2: number = jsh.loader.value(FILE, scope, t2);
					verify(t2).thisName.evaluate(String).is("rsi:battery");
					verify(v2).is(5);
				}

				fifty.tests.exports.module = fifty.test.Parent();

				fifty.tests.exports.module.suite = function() {
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
							},
							evaluate: $api.fp.identity
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
				};

				fifty.tests.exports.module.jsapi = function() {
					// TODO: Unclear what this is really testing, but adapted from previous (inefficient) integration test
					var loader = new jsh.file.Loader({ directory: fifty.jsh.file.object.getRelativePath("test/module-loader").directory });
					var module = loader.module("module.js");
					var method = module.$loader.get;
					verify(module).$loader.evaluate.property("get").is.type("function");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			/**
			 * Loads `jsh` plugins from a given location.
			 */
			plugins: (p:
				slime.runtime.loader.Synchronous<any>
				| slime.jrunscript.file.Location
				| slime.Loader
				| slime.jrunscript.file.Pathname
				| slime.jrunscript.file.Directory
			) => void

			addFinalizer: any
			java: {
				toString: () => string
				add: (pathname: slime.jrunscript.file.Pathname) => void
				getClass: (name: any) => any
			}
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
			synchronous: slime.jsh.plugin.$slime["loader"]["synchronous"]
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
							rv.push("jsh");
							if (built) rv.push("jrunscript/jsh/test/tools/run-in-built-shell.jsh.js");
							rv.push("jrunscript/jsh/loader/test/global-scope.jsh.js");
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
							rv.push("jsh");
							rv.push("jrunscript/jsh/loader/test/plugin-scope.jsh.js");
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
				fifty.run(fifty.tests.exports);

				fifty.load("plugins.fifty.ts");
				fifty.load("test/worker/suite.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const $jsapi = {
				environment: {
					jsh: {
						unbuilt: {
							src: fifty.jsh.file.object.getRelativePath("../..").directory
						}
					}
				}
			}

			//	This is a manual test because CloudFlare currently blocks downloads of CoffeeScript.
			//	CoffeeScript support is probably going to be dropped soon, anyway.
			fifty.tests.manual.coffeescript = function() {
				if (jsh.shell.jsh.lib.getFile("coffee-script.js")) {
					type jshResult = { status: number, stdio?: { output?: string } }
					var hello: jshResult = jsh.shell.jsh({
						shell: $jsapi.environment.jsh.unbuilt.src,
						script: $jsapi.environment.jsh.unbuilt.src.getRelativePath("jrunscript/jsh/loader/test/coffee/hello.jsh.coffee").file,
						stdio: {
							output: String
						},
						evaluate: function(result) {
							return result;
						}
					});
					verify(hello).status.is(0);
					verify(hello).stdio.output.is(["hello coffeescript world",""].join(String(Packages.java.lang.System.getProperty("line.separator"))));
					var loader: jshResult = jsh.shell.jsh({
						fork: true,
						script: $jsapi.environment.jsh.unbuilt.src.getFile("jrunscript/jsh/loader/test/coffee/loader.jsh.js")
					});
					verify(loader).status.is(0);
				} else {
					var MESSAGE = "No CoffeeScript.";
					verify(MESSAGE).is(MESSAGE);
				}
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Global {
		loader: slime.jsh.loader.Exports
	}

	export namespace internal.loader {
		/**
		 * Extends the {@link slime.jrunscript.runtime.Exports | SLIME Java runtime} to provide facilities for exiting a `jsh`
		 * shell and for launching a `jsh` subshell.
		 */
		export interface Runtime extends slime.jrunscript.runtime.Exports {
			//	implementations provided by engine-specific rhino.js and nashorn.js

			exit: (status: number) => never

			jsh: (configuration: slime.jrunscript.native.inonit.script.jsh.Shell.Environment, invocation: slime.jrunscript.native.inonit.script.jsh.Shell.Invocation) => number
		}
	}
}
