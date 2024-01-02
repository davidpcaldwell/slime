//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.java.tools {
	export interface Context {
		library: {
			java: slime.jrunscript.host.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;

			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					file: jsh.file,
					java: jsh.java,
					shell: jsh.shell
				}
			});
		//@ts-ignore
		})(fifty);

		export const jar = (function(fifty: slime.fifty.test.Kit) {
			var jsh = fifty.global.jsh;

			return jsh.file.Searchpath([
				jsh.shell.java.home.getRelativePath("bin"),
				jsh.shell.java.home.parent.getRelativePath("bin")
			]).getCommand("jar");
		//@ts-ignore
		})(fifty);
	}

	/**
	 * The result of a compilation.
	 */
	export interface JavacResult {
		/**
		 * The exit status returned by `javac`.
		 */
		status: number

		/**
		 * The set of arguments sent to the `javac` command.
		 */
		arguments: string[]
	}

	export interface Exports {
		/**
		 * (present only if a Java compiler is available)
		 *
		 * Executes the Java compiler. See the documentation for
		 * [UNIX](http://docs.oracle.com/javase/7/docs/technotes/tools/solaris/javac.html) and
		 * [Windows](http://docs.oracle.com/javase/7/docs/technotes/tools/windows/javac.html) operating systems.
		 */
		javac?: {
			/**
			 * @deprecated Use the form that returns the result and pipe that to another function using `$api.fp.pipe` for
			 * this behavior.
			 */
			<R>(p: {
				debug?: boolean
				destination?: slime.jrunscript.file.Pathname
				classpath?: slime.jrunscript.file.Searchpath
				sourcepath?: slime.jrunscript.file.Searchpath
				source?: string
				target?: string
				arguments: any[]

				/**
				 * A function that will be invoked when compilation is complete, will be provided with information about the result,
				 * and specifies the return value of `javac`.
				 *
				 * If omitted, an implementation is provided that throws an exception if the exit status is non-zero and returns its
				 * argument if the exit status is zero.
				 *
				 * @param result The result of the compilation.
				 * @returns A value to be returned by the `javac` method.
				 */
				evaluate: (result: JavacResult) => R
			}): R

			/**
			 * @returns The result of the compilation
			 */
			(p: {
				/**
				 * If `true`, debugging information is emitted by the compiler using the `-g` flag.
				 */
				debug?: boolean

				/**
				 * (optional) Represents a directory to which files should be emitted, which will be supplied to `javac` as the `-d`
				 * argument. The directory will be created if it does not exist; if its parent does not exist, an exception will be
				 * thrown.
				 */
				destination?: slime.jrunscript.file.Pathname

				/**
				 * (optional) A path from which to load class dependencies, which will be supplied to `javac` as the `-classpath`
				 * argument.
				 */
				classpath?: slime.jrunscript.file.Searchpath

				/**
				 * (optional) A path from which to load source dependencies, which will be supplied to `javac` as the `-sourcepath`
				 * argument.
				 */
				sourcepath?: slime.jrunscript.file.Searchpath

				/**
				 * (optional) A release version which will be supplied to `javac` as the `-source` argument.
				 */
				source?: string

				/**
				 * (optional) A release version which will be supplied to `javac` as the `-target` argument.
				 */
				target?: string

				/**
				 * A set of source files to compile.
				 */
				arguments: (slime.jrunscript.file.File | slime.jrunscript.file.Pathname)[]
			}): JavacResult
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.javac = function() {
				const { verify } = fifty;
				const { jsh } = fifty.global;
				const module = test.subject;
				var source = fifty.jsh.file.object.getRelativePath("test/java/Hello.java");
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true });
				module.javac({
					destination: tmp.pathname,
					arguments: [source.file]
				});
				jsh.shell.console("Compiled to " + tmp);
				var buffer = new jsh.io.Buffer();
				var output = jsh.shell.java({
					classpath: jsh.file.Searchpath([tmp.pathname]),
					main: "Hello",
					stdio: {
						output: buffer.writeBinary()
					},
					evaluate: function(result) {
						buffer.close();
						return buffer.readText().asString();
					}
				});
				jsh.shell.console("output: [" + output + "]");
				//	TODO	platform-dependent, possibly
				verify(output,"output of Hello.java").is(String(Packages.java.lang.String.format("Hello, World!%n")));
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Manifest {
		main: {
			[name: string]: string
		}

		entries: {
			[name: string]: {
				[name: string]: string
			}
		}
	}

	export interface Exports {
		jar: {
			manifest: slime.$api.fp.world.Meter<
				{
					pathname: string
				},
				void,
				Manifest
			>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.jar = function() {
				var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.shell.run({
					command: test.jar,
					arguments: [
						"cfm",
						TMP.getRelativePath("foo.jar"),
						//	https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html#Manifest-Overview
						fifty.jsh.file.object.getRelativePath("test/manifest.txt"),
						"java"
					],
					directory: fifty.jsh.file.object.getRelativePath("test").directory
				});

				var manifest = $api.fp.world.now.ask(
					test.subject.jar.manifest({
						pathname: TMP.getRelativePath("foo.jar").toString()
					})
				);

				verify(manifest).main.evaluate.property("Foo").is("Bar");
				verify(manifest).main.evaluate.property("Baz").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Creates an object representing a [JAR file](https://docs.oracle.com/javase/8/docs/technotes/guides/jar/index.html).
		 */
		Jar: new (p: {
			/**
			 * A [JAR file](https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html).
			 */
			file: slime.jrunscript.file.File
		}) => {
			/**
			 * The JAR's [manifest](https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html#Manifest-Overview).
			 */
			manifest: {
				/**
				 * A set of name-value pairs representing the main properties in the manifest.
				 */
				main: {
					[name: string]: string
				}
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const module = test.subject;

			fifty.tests.Jar = function() {
				var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.shell.run({
					command: test.jar,
					arguments: [
						"cfm",
						TMP.getRelativePath("foo.jar"),
						//	https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html#Manifest-Overview
						fifty.jsh.file.object.getRelativePath("test/manifest.txt"),
						"java"
					],
					directory: fifty.jsh.file.object.getRelativePath("test").directory
				});

				var file = new module.Jar({
					file: TMP.getFile("foo.jar")
				});

				jsh.shell.console(JSON.stringify(file.manifest));

				verify(file).manifest.main.evaluate.property("Foo").is("Bar");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.javac);
				fifty.run(fifty.tests.jar);
				fifty.run(fifty.tests.Jar);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
