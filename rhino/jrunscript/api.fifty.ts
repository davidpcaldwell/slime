//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native {
	export namespace org.mozilla.javascript {
		export interface Context extends slime.jrunscript.native.java.lang.Object {
			getApplicationClassLoader: () => slime.jrunscript.native.java.lang.ClassLoader
			getOptimizationLevel: () => number
			getImplementationVersion: () => slime.jrunscript.native.java.lang.String
		}
	}

	//	TODO	Add org.openjdk.nashorn equivalent
	export namespace jdk.nashorn.internal.runtime {
		export interface Context extends slime.jrunscript.native.java.lang.Object {
		}
	}
}

namespace slime.jrunscript {
	export interface Packages {
		jdk: {
			nashorn: {
				internal: {
					runtime: {
							//	TODO	Add org.openjdk.nashorn equivalent
							Context: slime.jrunscript.JavaClass<slime.jrunscript.native.jdk.nashorn.internal.runtime.Context, {
							class: slime.jrunscript.native.java.lang.Class
							getContext: () => slime.jrunscript.native.java.lang.Object
						}>
					}
				}
			}
		}
	}
}

/**
 * Definitions of types pertaining to the Java bootstrap scripts. The bootstrap script at `api.js` is launched via `jrunscript` and
 * uses the Nashorn engine to configure the SLIME Java environment.
 *
 * The bootstrap script expects the global scope to be of type {@link slime.internal.jrunscript.bootstrap.Environment} when it is
 * loaded. Most properties of `Environment` are expected to be provided by the loaded JavaScript engine, but it can also receive an
 * optional {@link slime.internal.jrunscript.bootstrap.Configuration} that it will use by setting the `$api` property of the
 * JavaScript global object to a value of that type.
 *
 * After the script executes, it expects the global object to be of type {@link slime.internal.jrunscript.bootstrap.Global}.
 *
 * The script compiles Java code and checks for the presence of JavaScript engines. It is designed to run with no dependencies
 * except on the JDK (and Nashorn).
 *
 * Arguments can be passed to the bootstrap script via the query string when it is invoked as a URL (for example, when loaded over
 * a network), or can be passed on the command line if being invoked locally (they will be parsed out via the JSR 223 APIs, or
 * engine-specific APIs).
 *
 * However, so that code does not have to be developed twice - once for the bootstrap script and once for the SLIME Java runtime -
 * the bootstrap script can also be embedded in the SLIME Java runtime using the `embed.js` script, which packages the bootstrap
 * script as an ordinary {@link slime.loader.Script} that can be loaded by the SLIME Java runtime.
 *
 * In the context of the `jsh` shell, which is invoked with the `jsh` query parameter, the bootstrap script builds the Java portions
 * of the `jsh` loader process and launches the `jsh` loader configured appropriately.
 */
namespace slime.internal.jrunscript.bootstrap {
	export namespace test {
		export const jar = (function(fifty: slime.fifty.test.Kit) {
			var jsh = fifty.global.jsh;

			//	TODO	believe there is a better way to do this now, maybe with a jsh.shell.java.Jdk call of some kind
			return jsh.file.Searchpath([
				jsh.shell.java.home.getRelativePath("bin"),
				jsh.shell.java.home.parent.getRelativePath("bin")
			]).getCommand("jar");
		//@ts-ignore
		})(fifty);

		export const subject = (function(fifty: slime.fifty.test.Kit) {
			return fifty.global.jsh.internal.bootstrap;
		//@ts-ignore
		})(fifty);
	}

	/**
	 * An object that can be used to configure the invocation of the `api.js` script, by setting the `$api` property of the global
	 * object to an object of this type. This value will be *overwritten* by the {@link Global} value exported by the script.
	 */
	export interface Configuration {
		script?: {
			file?: string
			url?: string
		}
		engine?: {
			script?: any
		}
		arguments?: string[]
		debug?: boolean
	}

	export interface JavaClasspath {
		liveconnect: (name: string) => slime.jrunscript.JavaClass<any,any>
		nativeClass: (name: string) => slime.jrunscript.native.java.lang.Class
		update: () => void
	}

	/**
	 * Refers to the currently executing script.
	 */
	export interface Script {
		toString: () => string

		load: () => void

		/**
		 * The file from which the current script was loaded.
		 */
		file?: slime.jrunscript.native.java.io.File

		url?: slime.jrunscript.native.java.net.URL

		jar?: {
			url: slime.jrunscript.native.java.net.URL
			file: slime.jrunscript.native.java.io.File
			path: string
		}

		resolve: (path: string) => Script
	}

	//	TODO	Rhino is never used for the bootstrap script at this point
	/**
	 * APIs the jrunscript bootstrap script uses that are provided by the underlying jrunscript JavaScript engine and shell, such as
	 * `load()`, `Packages`, `readFile`, `Java.type`, and so forth, as well as an optional {@link Configuration} object provided by
	 * the caller in the `$api` property of the global object.
	 */
	export interface Environment {
		/**
		 * A function compatible with the
		 * [Nashorn shell `load()` function](https://docs.oracle.com/javase/10/nashorn/nashorn-and-shell-scripting.htm).
		 */
		load: {
			(fileOrUrl: string): void
			//	TODO	would like to name script property to js but it caused regression
			(p: { name: string, script: slime.jrunscript.native.java.lang.String })
		}

		//	Rhino compatibility
		Packages: slime.jrunscript.Packages
		JavaAdapter?: slime.jrunscript.JavaAdapter

		/**
		 * Reads a URL in a way compatible with the Rhino shell. See the
		 * [Rhino documentation](https://rhino.github.io/tools/shell/).
		 *
		 * If provided in the global scope (the Rhino engine provides it), the existing implementation will be used. Otherwise, a
		 * compatible implementation will be supplied.
		 */
		readUrl?: (url: string) => string

		//	Nashorn-provided
		//	Used to provide debug output before Packages is loaded
		//	Used in jsh/launcher/main.js
		Java?: {
			type: (name: string) => slime.jrunscript.JavaClass & {
				class: slime.jrunscript.native.java.lang.Class
			}
		}

		$api?: Configuration
	}

	export namespace internal {
		export namespace io.zip {
			export type Processor = {
				directory: (name: string) => void
				write: (name: string, _stream: slime.jrunscript.native.java.io.InputStream) => void
			}
		}

		export type Io = {
			/**
			 * Copies `from` to `to`. Closes output stream but not input stream.
			 */
			copy: slime.internal.jrunscript.bootstrap.Api<{}>["io"]["copy"]

			zip: {
				parse: (_stream: slime.jrunscript.native.java.io.InputStream, destination: io.zip.Processor) => void
			}

			readJavaString: (from: slime.jrunscript.native.java.io.InputStream) => slime.jrunscript.native.java.lang.String
		}

		export interface Engine {
			resolve: Api<any>["engine"]["resolve"]
			getCallingScript: Api<any>["engine"]["getCallingScript"]
			getClass: <T extends slime.jrunscript.native.java.lang.Object,C>(name: string) => slime.jrunscript.JavaClass<T,C>
			newArray: <T extends slime.jrunscript.native.java.lang.Object,C>(type: slime.jrunscript.JavaClass<T,C>, length: number)
				=> slime.jrunscript.Array<T>
			script: string		}
	}


	export namespace github {
		export type Archive = {
			read: (name: string) => slime.jrunscript.native.java.io.InputStream
			list: (path: string) => string[]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Api<J> {
		debug: {
			(message: string): void
			on: boolean
		}

		console: any

		log: any

		engine: {
			toString: () => string

			/**
			 * A method which, given values for each potential JavaScript engine, returns the value for the engine that is actually
			 * running.
			 *
			 * @param option An object with a property for each potential JavaScript engine
			 *
			 * @returns The value of the property representing the JavaScript engine which is running.
			 */
			resolve: <T>(option: {
				rhino: T
				nashorn: T
				graal: T

				//	legacy compatibility with pre-JDK 8 Rhino; now unsupported
				jdkrhino?: T
			}) => T

			readUrl: Environment["readUrl"]

			/**
			 * Attempts to be compatible with the old Rhino shell `runCommand` implementation.
			 *
			 * @param arguments A set of tokens for the command line, followed optionally by a "mode" argument
			 * @returns The exit status of the command
			 */
			runCommand: (...arguments: any[]) => number

			getCallingScript: () => string

			rhino: {
				/**
				 * The location from which Rhino was loaded, specifically the `org.mozilla.javascript.Context` class.
				 */
				classpath: () => slime.jrunscript.native.java.io.File

				/**
				 * Whether Rhino is currently available on the classpath.
				 */
				isPresent: () => boolean

				/**
				 * If Rhino is currently running this script, the current Rhino script context.
				 */
				running: () => slime.jrunscript.native.org.mozilla.javascript.Context
			}

			nashorn: {
				isPresent: () => boolean
				//	TODO	Add org.openjdk.nashorn equivalent? Or is the fact that the types are equivalent enough?
				running: () => slime.jrunscript.native.jdk.nashorn.internal.runtime.Context
			}
		}

		github: {
			archives: {
				/**
				 * Given the URL of a raw source file on GitHub, returns the string content of that file.
				 */
				getSourceFile: (url: slime.jrunscript.native.java.net.URL) => slime.jrunscript.native.java.lang.String

				/**
				 * Given a base GitHub URL under which raw source files may be found, returns a list of URLs containing raw source
				 * files that are under that base.
				 */
				getSourceFilesUnder: (url: slime.jrunscript.native.java.net.URL) => slime.jrunscript.native.java.net.URL[]
			}
			test: {
				zip: (_stream: slime.jrunscript.native.java.io.InputStream) => github.Archive
				toArchiveLocation: (url: slime.jrunscript.native.java.net.URL) => {
					zipUrl: slime.jrunscript.native.java.net.URL
					path: string
				}
			}
		}

		Script: {
			new (p: { caller: true }): Script
			new (p: { string: string }): Script
			new (p: { file: slime.jrunscript.native.java.io.File }): Script
			new (p: { url: slime.jrunscript.native.java.net.URL }): Script

			run: (p: any) => void

			test: {
				interpret: (string: string) => {
					file?: slime.jrunscript.native.java.io.File
					url?: slime.jrunscript.native.java.net.URL
				}
			}
		}

		script: Script

		arguments: string[]
	}

	export namespace java {
		export interface Install {
			toString: () => string

			home: slime.jrunscript.native.java.io.File
			launcher: slime.jrunscript.native.java.io.File
			jrunscript: slime.jrunscript.native.java.io.File

			compile: (args: string[]) => void

			getMajorVersion: () => number
		}

		(
			function(
				Packages: slime.jrunscript.Packages,
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				fifty.tests.manual.java = {};
				fifty.tests.manual.java.Install = {};
				fifty.tests.manual.java.Install.getMajorVersion = function() {
					var jdk = $api.fp.now(fifty.jsh.file.relative("../../local/jdk"), jsh.file.Location.directory.base);
					//	TODO	is there no API for this?
					var toJavaFile = function(location: slime.jrunscript.file.Location) { return new Packages.java.io.File(location.pathname); };
					var toJavaInstall = jsh.internal.bootstrap.java.Install;
					var getMajorVersion = function(it: Install) {
						return {
							version: it.getMajorVersion(),
							home: it.home
						}
					};
					var console = function(p: ReturnType<typeof getMajorVersion>) { jsh.shell.console("Major version at " + p.home + " is " + p.version)};
					var process = $api.fp.pipe(jdk, toJavaFile, toJavaInstall, getMajorVersion, console);
					process("8");
					process("11");
					process("17");
					process("21");
				}
			}
		//@ts-ignore
		)(Packages,fifty);

	}

	export interface Api<J> {
		java: {
			/**
			 * @param home A directory containing a Java installation
			 */
			Install: (home: slime.jrunscript.native.java.io.File) => java.Install

			/**
			 * The Java installation used to run this script.
			 */
			install: java.Install

			getClass: (name: string) => slime.jrunscript.JavaClass
			Array: any
			Command: any

			versions: {
				getMajorVersion: {
					forJavaVersionProperty: (value: string) => number
				}
			}

			/**
			 * Returns ths major version number for the currently running Java virtual machine.
			 */
			getMajorVersion: () => number
		} & J
	}

	export interface Api<J> {
		io: {
			tmpdir: (p?: { prefix?: string, suffix?: string }) => slime.jrunscript.native.java.io.File

			copy: (from: slime.jrunscript.native.java.io.InputStream, to: slime.jrunscript.native.java.io.OutputStream) => void

			download: (p: {
				url: string
				to: slime.jrunscript.native.java.io.File
			}) => void

			unzip: (p: {
				from: {
					url: string
				}
				to: {
					_directory: slime.jrunscript.native.java.io.File
				}
			}) => void

			readJavaString: (from: slime.jrunscript.native.java.io.InputStream) => slime.jrunscript.native.java.lang.String
		}
	}

	/**
	 * A downloadable Java library, like Mozilla Rhino or GraalJS. A library is modeled as having a defined structure that fits into
	 * a single directory, so the application can check whether it is there and download it if it is not.
	 */
	export interface Library {
		version: string

		/**
		 * Downloads the library into the specified directory and returns the URLs of the JAR files that make up the library.
		 */
		download: (directory: slime.jrunscript.native.java.io.File) => slime.jrunscript.native.java.net.URL[]

		/**
		 * Checks whether the specified library is already present in the specified directory and, if it is, returns the URLs of the
		 * JAR files that make up the library; otherwise, returns `null`.
		 */
		local: (directory: slime.jrunscript.native.java.io.File) => slime.jrunscript.native.java.net.URL[]
	}

	export namespace jar {
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
	}

	export interface Api<J> {
		jar: {
			manifest: (file: slime.jrunscript.native.java.io.File) => slime.internal.jrunscript.bootstrap.jar.Manifest

			//	TODO	feels like this method is redundant and not needed, but will have to analyze use cases
			toScriptManifest: (manifest: slime.jrunscript.native.java.util.jar.Manifest) => jar.Manifest
		}
	}

	export interface Api<J> {
		rhino: {
			forJava: (jdkMajorVersion: number) => Library
		}
	}

	export interface Api<J> {
		nashorn: {
			dependencies: {
				maven: {
					group: string
					artifact: string
					version: string
				}[]

				names: string[]

				jarNames: string[]
			}

			getDeprecationArguments: (javaMajorVersion: number) => string[]
		}

		shell: {
			environment: any
			HOME: any
			exec: any
		}

		embed: {
			jsh?: Script
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			const script: slime.jrunscript.bootstrap.Script = fifty.$loader.script("embed.js");
			const api = script({
				debug: false,
				script: {}
			});

			fifty.tests.manual.nashorn = function() {
				jsh.shell.console(JSON.stringify(api.nashorn.dependencies))
			}
		}
	//@ts-ignore
	)(fifty);

	/**
	 * The `Global` is the type definition that is applied to the script's `this` value. Normally, the global object (`globalThis`)
	 * is used, but the script is compatible with any object being used for this purpose.
	 *
	 * The script can receive parameters if they are already attached to `this.$api`; see {@link Configuration}.
	 *
	 * @typeParam T - An object specifying a set of properties to add to the `$api` property.
	 * @typeParam J - An object specifying a set of properties to add to the `$api.java` property.
	 */
	export interface Global<T,J = {}> extends Omit<Environment,"$api"> {
		$api: Api<J> & T
	}

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.Kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.io = function() {
				var configuration: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, configuration);
				var global: slime.internal.jrunscript.bootstrap.Global<{},{}> = configuration as unknown as slime.internal.jrunscript.bootstrap.Global<{},{}>;
				var thisPathname = fifty.jsh.file.object.getRelativePath("api.fifty.ts");
				var jshReadThisFile = thisPathname.file.read(String);
				var bootstrapReadThisFile = (function() {
					var javaFile = thisPathname.java.adapt();
					var _input = new Packages.java.io.FileInputStream(javaFile);
					var _string = global.$api.io.readJavaString(_input);
					var string = String(_string);
					return string;
				})();
				var same = (jshReadThisFile == bootstrapReadThisFile);
				verify(same, "files are the same").is(true);
			}

			fifty.tests.zip = function() {
				var web = jsh.unit.mock.Web();
				web.add(jsh.unit.mock.web.Github({
					src: {
						davidpcaldwell: {
							slime: jsh.tools.git.oo.Repository({ directory: jsh.shell.jsh.src })
						}
					}
				}));
				web.start();
				var client = web.client;
				var zip = client.request({
					url: "http://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip"
				});
				fifty.verify(zip).status.code.is(200);

				var configuration: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, configuration);
				var global: slime.internal.jrunscript.bootstrap.Global<{},{}> = configuration as unknown as slime.internal.jrunscript.bootstrap.Global<{},{}>;

				var archive = global.$api.github.test.zip(zip.body.stream.java.adapt());
				verify(archive).read("slime-master/rhino/jrunscript/api.fifty.ts").is.type("object");
				verify(archive).read("slime-master/rhino/jrunscript/api.fifty.ts.foo").is.type("null");
				var descriptor: slime.jrunscript.runtime.old.resource.Descriptor = {
					read: {
						binary: function() {
							return jsh.io.java.adapt(archive.read("slime-master/rhino/jrunscript/api.fifty.ts"));
						}
					}
				}
				var resource = new jsh.io.Resource(descriptor);
				var fromZip = resource.read(String);
				var fromFilesystem = fifty.jsh.file.object.getRelativePath("api.fifty.ts").file.read(String);
				var filesAreEqual = fromZip == fromFilesystem
				verify(filesAreEqual,"filesAreEqual").is(true);

				var folder = archive.list("slime-master/rhino/jrunscript/").sort(function(a,b) {
					if (a < b) return -1;
					if (b < a) return 1;
					return 0;
				});
				verify(folder).is.type("object");
				verify(folder).length.is(4);
				verify(folder)[3].is("test/");
				var top = archive.list("");
				verify(top).length.is(1);
				verify(top)[0].is("slime-master/");

				fifty.run(function() {
					var subject = global.$api;

					var toZipLocation = function(string): (p: any) => { zip: string, path: string } {
						return Object.assign(function(p) {
							var result = p.toArchiveLocation(string);
							return (result) ? {
								zip: String(result.zip),
								path: result.path
							} : null
						}, {
							toString: function() { return "toZipLocation(" + string + ")"}
						})
					}

					fifty.verify(subject).github.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).zip.is("http://github.com/davidpcaldwell/slime/archive/refs/heads/branch.zip");
					fifty.verify(subject).github.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).path.is("rhino/jrunscript/api.js");

					fifty.verify(subject).github.test.evaluate(toZipLocation("http://example.com/path")).is(null);

					fifty.verify(subject).github.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/loader/jrunscript/java/")).zip.is("http://github.com/davidpcaldwell/slime/archive/refs/heads/branch.zip");
					fifty.verify(subject).github.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/loader/jrunscript/java/")).path.is("loader/jrunscript/java/");
				});
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);

				var configuration: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, configuration);
				var global: slime.internal.jrunscript.bootstrap.Global<{},{}> = configuration as unknown as slime.internal.jrunscript.bootstrap.Global<{},{}>;
				fifty.verify(global).is.type("object");
				fifty.verify(global).$api.is.type("object");
				fifty.verify(global).$api.script.is.type("object");

				var subject = global.$api;

				var interpret = function(string) {
					return Object.assign(function(p): { url: string, file: string, zip: string } {
						var result = p.interpret(string);
						var entries: [name: string, value: any][] = [];
						if (result.url) entries.push(["url",String(result.url)]);
						if (result.file) entries.push(["file",String(result.file)]);
						if (result.zip) entries.push(["zip",String(result.zip)]);
						//	TODO	try to figure out obscure issue below
						//@ts-ignore
						return Object.fromEntries(entries);
					}, {
						toString: function() { return "interpret(" + string + ")"}
					})
				};

				fifty.verify(subject).Script.test.evaluate(interpret("http://server.com/path")).url.is("http://server.com/path");

				fifty.verify(subject).Script.test.evaluate(interpret("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).url.is("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js");
				fifty.verify(subject).Script.test.evaluate(interpret("https://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).url.is("https://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js");
			}

			//	This will generate an exception under Rhino, but executes successfully under Nashorn.
			fifty.tests.manual.load = function() {
				var global = (function() { return this; })();
				fifty.$loader.run("api.js", {}, global);
				jsh.shell.console("Loaded.");
			};

			fifty.tests.manual.jsh = {};
			//fifty.tests.manual.jsh.
		}
	//@ts-ignore
	)(Packages,fifty);

}
