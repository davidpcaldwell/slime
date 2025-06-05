//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.shell {
	export namespace context {
		export type OutputStream = Omit<slime.jrunscript.runtime.io.OutputStream, "close">

		/**
		 * Represents a process output stream to which bytes and characters can be written.
		 */
		export type Console = OutputStream & {
			/**
			 * Writes a string to the stream and then flushes the stream.
			 *
			 * @param string A string to write to this console.
			 */
			write: (string: string) => void
		}

		export interface Stdio {
			input?: slime.jrunscript.runtime.io.InputStream
			output: OutputStream
			error: OutputStream
		}
	}

	export interface Context {
		/**
		 * (optional: if omitted, the actual operating system environment will be used.) An object representing the operating system
		 * environment.
		 */
		_environment?: slime.jrunscript.native.inonit.system.OperatingSystem.Environment

		/**
		 * (optional: if omitted, the actual system properties will be used.) A set of properties representing Java system
		 * properties.
		 */
		_properties?: slime.jrunscript.native.java.util.Properties

		stdio: context.Stdio

		kotlin: {
			compiler: slime.jrunscript.file.File
		}

		api: {
			java: slime.jrunscript.java.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			//httpd: any

			js: slime.$api.old.Exports

			/**
			 * The `js/document` module.
			 */
			document: slime.old.document.Exports

			xml: {
				parseFile: (file: slime.jrunscript.file.File) => slime.old.document.Document
			}
		}

		world?: {
			subprocess?: context.subprocess.World
		}
	}

	export namespace test {
		export const jsapiModule = (function(Packages: slime.jrunscript.Packages, fifty: slime.fifty.test.Kit) {
			const { jsh } = fifty.global;

			const fixtures: slime.jrunscript.shell.test.Script = fifty.$loader.script("fixtures.ts");

			var context = new function() {
				var java = fifty.$loader.module("../../jrunscript/host/", {
					$slime: jsh.unit.$slime,
					logging: {
						prefix: "slime.jrunscript.shell.test"
					}
				});
				var io = fifty.$loader.module("../../jrunscript/io/", {
					api: {
						java: java,
						mime: jsh.unit.$slime.mime
					},
					$slime: jsh.unit.$slime
				});
				const file: slime.jrunscript.file.Script = fifty.$loader.script("../../rhino/file/");
				this.api = {
					js: fifty.$loader.module("../../js/object/"),
					java: java,
					io: io,
					file: file(
						(
							function() {
								var pathext = void(0);
								if (jsh.shell.environment.PATHEXT) {
									pathext = jsh.shell.environment.PATHEXT.split(";");
								}
								this.$rhino = jsh.unit.$slime;
								this.api = {
									io: io,
									js: jsh.js,
									java: jsh.java
								};
								this.addFinalizer = jsh.loader.addFinalizer;
								//	TODO	below copy-pasted from rhino/file/api.html
								//	TODO	switch to use appropriate jsh properties, rather than accessing Java system properties directly
								var System = Packages.java.lang.System;
								var cygwin = void(0);
								if (System.getProperty("cygwin.root")) {
									cygwin = {
										root: String( System.getProperty("cygwin.root") )
									};
									if (System.getProperty("cygwin.paths")) {
										//	Using the paths helper currently does not seem to work in the embedded situation when running inside
										//	the SDK server
										//	TODO	check this
										cygwin.paths = String( System.getProperty("cygwin.paths") );
									}
								}
								return {
									pathext: pathext,
									$rhino: jsh.unit.$slime,
									api: {
										io: io,
										js: jsh.js,
										java: jsh.java,
										loader: {
											Store: jsh.loader.Store
										}
									},
									addFinalizer: jsh.loader.addFinalizer,
									cygwin: cygwin
								}
							}
						)()
					),
					document: fifty.$loader.module("../../js/document/"),
					xml: {
						parseFile: function(file) {
							return new jsh.document.Document({ string: file.read(String) });
						}
					}
				};
				this._properties = Packages.java.lang.System.getProperties();
				this._environment = Packages.inonit.system.OperatingSystem.Environment.SYSTEM;
				this.stdio = {
					output: jsh.shell.stdio.output,
					error: jsh.shell.stdio.error
				}
			}

			return fixtures().load(context);
		//@ts-ignore
		})(Packages, fifty);
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace exports {
		export interface subprocess {}
	}

	export interface Exports {
		subprocess: exports.subprocess
	}

	export namespace exports {
		export interface subprocess {
			action: slime.$api.fp.world.Means<run.Intention,run.TellEvents>
			question: slime.$api.fp.world.Sensor<run.Intention,run.AskEvents,run.Exit>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const subject = jsh.shell;

				fifty.tests.manual.subprocess = {};

				fifty.tests.manual.subprocess.question = $api.fp.impure.Process.create({
					input: $api.fp.impure.Input.map(
						$api.fp.impure.Input.value({
							command: "ls",
							stdio: {
								output: "string"
							}
						} as slime.jrunscript.shell.run.Intention),
						$api.fp.world.mapping(subject.subprocess.question)
					),
					output: $api.fp.pipe(
						$api.fp.JSON.stringify({ space: 4 }),
						jsh.shell.console
					)
				});
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		/**
		 * APIs that pertain to {@link Intention}s.
		 */
		Intention: exports.Intention
	}

	export namespace exports {
		export interface Intention {
			/**
			 * An empty object to which derivations of this module may add methods.
			 */
			from: {
			}
		}
	}

	export interface Exports {
		listeners: $api.event.Emitter<{
			"run.start": any
		}>["listeners"]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.listeners = function() {
				const jsh = fifty.global.jsh;

				var subject: Exports = jsh.shell;

				var command = jsh.shell.PATH.getCommand("true");

				var log = (function() {
					var events = [];
					var listener: $api.event.Handler<any> = function(e) {
						events.push(e);
					};
					return {
						listener: listener,
						captured: function() {
							return events;
						}
					}
				})();

				subject.listeners.add("run.start", log.listener);

				fifty.verify(log).captured().length.is(0);

				subject.run({
					command: command
				});

				fifty.verify(log).captured().length.is(1);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * An object describing the environment provided via the {@link Context}, or the operating system process environment under
		 * which this script was executed if no environment was provided via the `Context`.
		 *
		 * Each variable defined in the environment is represented as a property in this object, with its name being the name of the
		 * property and its value being the value of that property. This object uses JavaScript semantics, and thus this object has
		 * case-sensitive names. In the event that the underlying operating system has environment variables that are *not*
		 * case-sensitive, all properties of this object will have UPPERCASE names.
		 */
		environment: {
			readonly [name: string]: string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.environment = function() {
				const jsh = fifty.global.jsh;
				const script: Script = fifty.$loader.script("module.js");

				var fixtures: slime.jrunscript.native.inonit.system.test.Fixtures = fifty.$loader.file("../../rhino/system/test/system.fixtures.ts");
				var o = fixtures.OperatingSystem.Environment.create({
					values: { foo: "bazz" },
					caseSensitive: true
				});
				fifty.verify(String(o.getValue("foo"))).is("bazz");

				var module: Exports = script({
					_environment: o,
					api: {
						java: jsh.java,
						io: jsh.io,
						file: jsh.file,
						js: jsh.js,
						document: jsh.js.document,
						xml: void(0)
					},
					_properties: void(0),
					kotlin: void(0),
					stdio: {
						output: jsh.shell.stdio.output,
						error: jsh.shell.stdio.error
					}
				});
				fifty.verify(module).environment.evaluate.property("foo").is("bazz");
				fifty.verify(module).environment.evaluate.property("xxx").is(void(0));
			}
		}
	//@ts-ignore
	)(fifty);

	interface Result {
		stdio?: {
			output?: string
		}
	}

	export namespace java {
		export interface Exports {
			//	TODO	The old comment stated that this argument was the same as the argument to `shell`, with classpath, jar, and
			//			main added. This seems likely to be wrong but looking at the implementation may reveal whether the types
			//			are related in the implementation.
			/**
			 * Launches a Java program.
			 */
			<R>(p: {
				vmarguments?: any
				properties?: any

				/**
				 * The classpath to pass to the Java process.
				 */
				classpath: slime.jrunscript.file.Searchpath

				/**
				 * The name of the main class to execute.
				 */
				main: string

				arguments?: any
				environment?: any
				stdio?: any
				directory?: any
				evaluate: (result: Result) => R
			}): R

			/**
			 * Launches a Java program.
			 */
			(p: {
				vmarguments?: any
				properties?: any
				classpath: any
				main: any
				arguments?: any
				environment?: any
				stdio?: any
				directory?: any
			}): Result

			/**
			 * Launches a Java program.
			 */
			(p: {
				vmarguments?: any
				properties?: any

				/**
				 * A JAR file to pass to `java -jar`.
				 */
				jar: slime.jrunscript.file.File
				arguments?: any
				stdio: any
				evaluate: any
			}): Result

			version: string

			keytool: any

			/**
			 * The Java launcher program, that is, the executable used to launch Java programs.
			 */
			launcher: slime.jrunscript.file.File

			jrunscript: slime.jrunscript.file.File

			/**
			 * The home directory of the Java installation used to run this shell.
			 */
			home: slime.jrunscript.file.Directory
		}
	}

	export interface Exports {
		java: java.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject = jsh.shell;

			fifty.tests.exports.java = function() {
				debugger;
				var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
				jsh.java.tools.javac({
					destination: to.pathname,
					arguments: [fifty.jsh.file.object.getRelativePath("test/java/inonit/jsh/test/Program.java")]
				});
				var buffer = new jsh.io.Buffer();
				var output = subject.java({
					classpath: jsh.file.Searchpath([to.pathname]),
					main: "inonit.jsh.test.Program",
					stdio: {
						output: buffer.writeBinary()
					},
					evaluate: function(result) {
						buffer.close();
						return buffer.readText().asString();
					}
				});
				verify(output).is("Hello");

				verify(subject).java.home.is.type("object");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		process: {
			directory: {
				/**
				 * Returns the pathname of the current working directory.
				 */
				get: slime.$api.fp.impure.Input<string>

				/**
				 * Changes the working directory.
				 */
				set: slime.$api.fp.impure.Output<string>
			}
		}
	}

	export interface Exports {
		/**
		 * @deprecated Replaced by `process.directory`.
		 *
		 * The current working directory.
		 */
		PWD: slime.jrunscript.file.Directory
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual.process = {};

			fifty.tests.manual.process.directory = function() {
				jsh.shell.console( jsh.shell.process.directory.get() );

				var ls = $api.fp.impure.Input.value(
					{
						command: "ls",
						stdio: {
							output: "string"
						}
					},
					$api.fp.world.Sensor.old.mapping({ sensor: jsh.shell.subprocess.question }),
					function(p) { return p; },
					$api.fp.property("stdio"),
					$api.fp.property("output")
				);

				jsh.shell.console("Before: " + ls());

				jsh.shell.process.directory.set("/etc");

				jsh.shell.console("After: " + ls());
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		/**
		 * Provides access to Java system properties.
		 */
		properties: {
			/**
			 * An object that attempts to allow the use of JavaScript semantics to access Java system properties. For example, the
			 * `java.home` system property is referenced as `properties.object.java.home`. This value can be examined using
			 * `String(properties.java.home)` to obtain its value as a `string`.
			 */
			object: any

			/**
			 * Returns the value of the specified system property, or `null` if it does not have a value.
			 *
			 * @param name
			 */
			get(name: string): string

			file: (name: string) => slime.jrunscript.file.File

			directory: (name: string) => slime.jrunscript.file.Directory

			searchpath: (name: string) => slime.jrunscript.file.Searchpath
		}

		/**
		 * A temporary directory that may be used by this shell.
		 */
		TMPDIR: slime.jrunscript.file.Directory

		USER: string

		/**
		 * The home directory of the user executing this shell.
		 */
		HOME: slime.jrunscript.file.Directory
	}

	export interface Exports {
		PATH?: slime.jrunscript.file.Searchpath
	}

	export interface Exports {
		/**
		 * An object representing the current operating system.
		 */
		os: {
			name: string
			arch: string
			version: string

			/**
			 * The line separator for this operating system.
			 */
			newline: string

			/**
			 * @deprecated Just use `os` as input to your function.
			 *
			 */
			resolve: {
				/**
				 * A function allowing operating system-specific code to be easily specified. Can be invoked with code like:
				 *
				 * ```
				 * os.resolve(function() {
				 *   if (this.name == "Linux") {
				 *     return [Linux-specific value];
				 *   }
				 *   else {
				 *     //	...
				 *   }
				 * });
				 * ```
				 *
				 * @param f A function that resolves OS-specific code. It is invoked with the `os` object representing the current
				 * operating system as `this` and can return a value accordingly.
				 * @returns An appropriate value of an arbitrary type for the current operating system.
				 */
				<T>(
					f: (
						/** The current `os` property. */
						this: Exports["os"]
					) => T
				): T

				/**
				 * An object with keys representing the names of operating systems. The value of the named property of the object
				 * corresponding to the current operating system will be returned. In the even that a property representing the
				 * operating system indicated by `os.name` is not present, the value `"Windows 7"` will be mapped to `Windows` and
				 * the values `"Mac OS X"` and `"Linux"` will be mapped to `UNIX`.
				 *
				 * @returns the value of the appropriate property of the given object.
				 */
				<T>(
					o: {
						Windows?: T
						UNIX?: T
						[x: string]: T
					}
				): T
			}

			process?: {
				/**
				 * (Mac OS X; untested on Linux)
				 *
				 * @experimental
				 */
				list: slime.jrunscript.shell.system.ps
			}

			//	Tested manually via the test/manual/sudo-old.jsh.js script with no arguments
			//	TODO	currently only implemented for Mac OS X
			sudo?: slime.jrunscript.shell.system.sudo

			//	TODO	should not be using internal types
			/**
			 * Uses the underlying operating system's `ping` command to attempt to reach another host.
			 */
			ping?: slime.jrunscript.shell.internal.os.Exports["ping"]

			//	TODO	should not depend on jsh; need to disentangle jsh["ui"] from jsh first and have a separate TypeScript
			//			definition for something like slime.jrunscript.ui or something
			inject: (dependencies: { ui: slime.jsh.Global["ui"] }) => void
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const module = shell.test.jsapiModule;

			fifty.tests.exports.os = fifty.test.Parent();

			fifty.tests.exports.os.process = fifty.test.Parent();

			fifty.tests.exports.os.process.list = function() {
				if (module.os.name == "Mac OS X") {
					verify(module).os.process.is.type("object");
					verify(module).os.process.evaluate.property("list").is.type("function");
					var ps = module.os.process.list();
					verify(ps)[0].is.type("object");
					verify(ps)[0].id.is.type("number");
					verify(ps)[0].command.is.type("string");
				}
			}

			fifty.tests.exports.os.ping = function() {
				//	TODO	this switch was put in place for some kind of VPN configuration, maybe? consider environment variable
				const noselfping = false;
				if (module.os.name == "Mac OS X") {
					verify(module).os.evaluate.property("ping").is.type("function");
					if (!noselfping) {
						var local = module.os.ping({ host: "127.0.0.1" });
						verify(local).status.evaluate(Number).is(0);
						verify(local).output.is.type("object");
						verify(local).output[0].is.type("string");
						verify(local).success.is.type("number");
					}

					var fake = module.os.ping({ host: "198.51.100.0", timeout: 1 });
					verify(fake).status.evaluate(Number).is(2);
					verify(fake).evaluate.property("success").is.type("undefined");
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		/**
		 * Launches a JavaScript script on a Java virtual machine.
		 */
		jrunscript: slime.jrunscript.shell.oo.Run<
			Omit<slime.jrunscript.shell.run.old.Argument,"command"|"arguments"> & {
				jrunscript?: slime.jrunscript.file.File

				/**
				 * Provides arguments to the script invocation (including the script as the first argument). These arguments
				 * will be augmented by those indicated by the `vmarguments` and `properties` properties.
				 */
				arguments: (string | slime.jrunscript.file.Pathname)[]

				/**
				 * A set of system properties to pass to the underlying virtual machine. Each property of the object represents a
				 * system property; the property name is the system property name, and the property value is the value of that
				 * system property.
				 */
				properties?: {
					[name: string]: string
				}

				/**
				 * An array of arguments to pass to the virtual machine running the script.
				 */
				vmarguments?: string[]
			}
		>
	}

	export interface Exports {
		/**
		 * Executes a Kotlin script in an external process.
		 * @param p
		 * @param receiver
		 * @returns See {@link Exports["run"]}.
		 */
		kotlin: (p: Omit<Parameters<Exports["run"]>[0],"command"> & {
			/**
			 * The script (`.kts`) to run.
			 */
			script: slime.jrunscript.file.File
		}, receiver?: any) => any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.manual.kotlin = function() {
				if (!jsh.shell.jsh.lib.getSubdirectory("kotlin")) {
					$api.fp.world.Sensor.now({
						sensor: jsh.shell.jsh.Intention.sensor,
						subject: {
							shell: {
								src: fifty.jsh.file.relative("../..").pathname
							},
							script: fifty.jsh.file.relative("../../jrunscript/jsh/tools/install/kotlin.jsh.js").pathname
						}
					})
				}
			}

			fifty.tests.exports.kotlin = function() {
				if (jsh.shell.jsh.lib.getSubdirectory("kotlin")) {
					var PATH = jsh.shell.PATH.pathnames;
					PATH.unshift(jsh.shell.java.home.getRelativePath("bin"));
					var result: { status: number, stdio: { error: string } } = jsh.shell.kotlin({
						script: fifty.jsh.file.object.getRelativePath("test/hello.kts").file,
						environment: $api.Object.compose(jsh.shell.environment, {
							PATH: jsh.file.Searchpath(PATH).toString()
						}),
						stdio: {
							error: String
						}
					});
					verify(result).status.is(0);
					verify(result).stdio.error.is("Hello from SLIME Kotlin!\n");
				} else {
					verify("No Kotlin.").is("No Kotlin.");
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		rhino: any

		/** @deprecated Replaced by the {@link slime.jrunscript.shell.exports.subprocess subprocess} APIs. */
		world: {
			/**
			 * @deprecated Replaced by the {@link Context} `world.subprocess` property, which allows a mock (or other) implementation to
			 * be used when loading the module. A mock implementation is provided in {@link slime.jrunscript.shell.test.Fixtures}.
			 *
			 * Allows a mock implementation of the `run` action to be created using a function that receives an invocation as an
			 * argument and returns an object describing what the mocked subprocess should do. The system will use this object to create
			 * the appropriate `Tell` and fire the appropriate events to the caller.
			 */
			mock: (delegate: (invocation: shell.run.old.Invocation) => shell.run.Mock) => slime.$api.fp.world.old.Action<run.old.Invocation,run.TellEvents>

			/** @deprecated */
			question: slime.$api.fp.world.Sensor<slime.jrunscript.shell.run.old.Invocation, slime.jrunscript.shell.run.AskEvents, slime.jrunscript.shell.run.Exit>
			/** @deprecated */
			action: slime.$api.fp.world.Means<slime.jrunscript.shell.run.old.Invocation, slime.jrunscript.shell.run.TellEvents>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const module = fifty.global.jsh.shell;

			fifty.tests.os = function() {
				var withColon = module.os.resolve(function() {
					return {
						name: ":" + this.name,
						arch: ":" + this.arch,
						version: ":" + this.version
					}
				});
				verify(withColon).name.is(":" + module.os.name);
				verify(withColon).arch.is(":" + module.os.arch);
				verify(withColon).version.is(":" + module.os.version);

				var name = module.os.resolve({
					"Mac OS X": "-Mac OS X",
					"Linux": "-Linux",
					"Windows": "-Windows"
				});
				//	TODO	test for Windows is terrible but this is deprecated
				if (module.os.name == "Windows 7") {
					verify(name).is("-Windows");
				} else if (module.os.name == "Mac OS X") {
					verify(name).is("-Mac OS X");
				} else if (module.os.name == "Linux") {
					verify(name).is("-Linux")
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		system: {
			apple: slime.jrunscript.shell.system.apple.Exports
			opendesktop: slime.jrunscript.shell.opendesktop.Exports
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			//	TODO	move to apple.fifty.ts
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const subject = jsh.shell;
			const module = test.jsapiModule;

			fifty.tests.exports.system = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>;

	export interface Exports {
		/** @deprecated */
		Invocation: exports.Invocation
	}

	export interface Exports {
		Tell: {
			exit: () => (tell: slime.$api.fp.world.old.Tell<run.TellEvents>) => run.TellEvents["exit"]
			mock: (stdio: Partial<Pick<slime.jrunscript.shell.run.StdioConfiguration,slime.jrunscript.shell.run.internal.SubprocessOutputStreamIdentity>>, result: slime.jrunscript.shell.run.Mock) => slime.$api.fp.world.old.Tell<slime.jrunscript.shell.run.TellEvents>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.exports.Tell = function() {
				var tell: slime.$api.fp.world.old.Tell<run.TellEvents> = jsh.shell.Tell.mock({
					output: "string"
				}, {
					exit: {
						status: 0,
						stdio: {
							output: "foobar"
						}
					}
				})

				var interpret = function(result: run.TellEvents["exit"]): string {
					return result.stdio.output + result.stdio.output;
				};

				var exit = jsh.shell.Tell.exit();
				var result = $api.fp.result(exit(tell), interpret);
				verify(result).is("foobarfoobar");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace internal.module {
		export type Invocation = {
			configuration: internal.run.java.Configuration
			result: {
				command: string | slime.jrunscript.file.Pathname | slime.jrunscript.file.File
				arguments: slime.jrunscript.shell.invocation.old.Token[]
				as: Parameters<Exports["run"]>[0]["as"]
			}
		}
	}

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			fifty.tests.jsapi = fifty.test.Parent();

			var module = shell.test.jsapiModule;

			var test = function(b: boolean) {
				fifty.verify(b).is(true);
			}

			fifty.tests.jsapi._1 = function() {
				var environment = module.environment;

				test( typeof(environment.PATH) != "undefined" );
				test( typeof(environment.ZZFF) == "undefined" );
			}

			var scope = {
				test: test
			};

			var properties = module.properties.object;

			//	TODO	rewrite the below tests in light of whatever we decide the correct semantics for properties are
			//	TODO	or just get rid of this construct altogether
			fifty.tests.jsapi.properties = function() {
				properties.foo = "bar";
				properties.foo.bar = "baz";

				properties.composite = {
					david: "caldwell",
					justine: "lutzel",
					home: "/home/inonit",
				};

				var property = function(name) {
					return function(o): string {
						var rv = o;
						var tokens = name.split(".");
						tokens.forEach(function(token) {
							rv = rv[token];
						});
						return rv;
					}
				};

				var type = function(v): string {
					return typeof(v);
				};

				verify(properties).evaluate(property("foo")).is("bar");

				//	TODO	fails; returns `undefined` instead
				if (false) verify(properties).evaluate(property("foo.bar")).is("baz");

				//	TODO	fails; TypeError: Cannot find default value for object.
				if (false) scope.test( String(properties.java) == "null" );

				scope.test( String(properties.java.version) != "null" );

				//	TODO	fails; type is string
				if (false) verify(properties.java.version).evaluate(type).is("object");

				scope.test( String(properties.composite.david) == "caldwell" );
				scope.test( String(properties.composite.david).substring(1,4) == "ald" );

				scope.test( String(properties.blah) == "undefined" );
			};

			fifty.tests.manual.properties = function() {
				var list = function(prefix,p) {
					for (var x in p) {
						if (p[x]) {
							Packages.java.lang.System.err.println(prefix+x + "=" + p[x]);
						}
						list(prefix+x+".",p[x]);
					}
				}

				Packages.java.lang.System.err.println("BEFORE:");
				list("",properties);

				Packages.java.lang.System.err.println("AFTER:");
				delete properties.foo;
				list("",properties);

				Packages.java.lang.System.err.println("JAVA:");
				list("",properties.java);
			}

			fifty.tests.manual.os = {};
			fifty.tests.manual.os.process = {};
			fifty.tests.manual.os.process.list = function() {
				var processes = fifty.global.jsh.shell.os.process.list().map(function(process) {
					return {
						id: process.id,
						parent: process.parent.id,
						command: process.command
					}
				});
				fifty.global.jsh.shell.console(JSON.stringify(processes,void(0),4));
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export interface Exports {
		browser: slime.jrunscript.shell.browser.Exports
	}
}

namespace slime.jrunscript.shell {
	export namespace invocation {
		export interface Argument {
			/**
			 * The command to run.
			 */
			command: string

			/**
			 * The arguments to supply to the command. If not present, an empty array will be supplied.
			 */
			arguments?: string[]

			/**
			 * The environment to supply to the command. If `undefined`, this process's environment will be provided.
			 */
			environment?: {
				[name: string]: string
			}

			//	TODO	possibly allow Location
			//	TODO	if this property is null, we should error, assuming the caller made a mistake passing a non-existent directory.
			/**
			 * The working directory in which the command will be executed. If not specified, this process's working directory
			 * will be provided.
			 */
			directory?: string

			stdio?: {
				input?: slime.jrunscript.shell.run.intention.Input
				output?: run.OutputCapture
				error?: run.OutputCapture
			}
		}
	}

	export namespace environment {
		/**
		 * Specifies a complete subprocess environment; no environment variables will be inherited from the context.
		 */
		export type Standalone = {
			only: {
				[x: string]: string
			}
		}

		/**
		 * Specifies certain variables and expects others to be provided by the execution context
		 * (usually a parent shell or process).
		 */
		export type Inherited = {
			/**
			 * Environment variables to be provided to the command, or to be removed from the environment of the command.
			 * Properties with string values represent variables to be provided to the command (potentially overriding
			 * values from the context). Properties with `null` values represent variables to be **removed** from
			 * the command's environment (even if they are present in the context). Properties that are undefined
			 * will have no effect.
			 */
			set: {
				[x: string]: string | null
			}
		}

		/**
		 * A value that either specifies a subprocess environment completely, or specifies modifications to make to the parent
		 * environment.
		 */
		export type Specification = Standalone | Inherited
	}

	export namespace bash {

		/**
		 * A subprocess intention that can be written as a shell command. As such, it excludes stdio redirection to streams, as
		 * only limited redirection (for example, to files) is possible using shell commands. Similarly, only limited ways of
		 * configuring the subprocess environment can be expressed in a shell command, so the `environment` property is represented
		 * by a more limited {@link bash.Environment}.
		 */
		export interface Intention {
			/**
			 * The command to execute.
			 */
			command: run.Intention["command"]

			/**
			 * Arguments to be sent to the command. If omitted, no arguments will be sent.
			 */
			arguments?: run.Intention["arguments"]

			/**
			 * The working directory to be used when executing the command. If omitted, the shell's current working directory
			 * will be used.
			 */
			directory?: run.Intention["directory"]

			environment?: environment.Specification
		}
	}

	export interface Exports {
		Environment: {
			is: {
				standalone: (p: environment.Specification) => p is environment.Standalone
				inherited: (p: environment.Specification) => p is environment.Inherited
			}

			/**
			 * Given a `bash.Environment`, provides a value suitable for use with {@link run.Intention}s.
			 */
			run: (p: environment.Specification) => run.Intention["environment"]
		}
	}

	export interface Exports {
		bash: {
			from: {
				/**
				 *
				 * @returns A function that can create `bash` script code from {@link bash.Intention} objects.
				 */
				intention: () => (p: bash.Intention) => string
			}

			run: (p: {
				stdio: run.Intention["stdio"]
			}) => (p: bash.Intention) => run.Intention
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;

			const subject = fifty.global.jsh.shell;

			fifty.tests.exports.bash = fifty.test.Parent();

			fifty.tests.exports.bash.from = function() {
				var it = subject.bash.from.intention()({
					command: "foo",
					arguments: ["bar", "baz"],
					directory: "/xxx/yyy/zzz",
					environment: {
						set: {
							foo: "bar",
							baz: null
						}
					}
				});
				verify(it).is([
					"#!/bin/bash",
					"cd /xxx/yyy/zzz",
					"env -u baz foo=\"bar\" foo bar baz"
				].join("\n"));
			};

			fifty.tests.exports.bash.environment = function() {
				var only: environment.Standalone = { only: { foo: "bar" } };
				var set: environment.Inherited = { set: { baz: "bizzy" } };

				fifty.run(function standalone() {
					var converted = subject.Environment.run(only);
					var result = converted({ one: "two" });
					verify(result).evaluate.property("foo").is("bar");
					verify(result).evaluate.property("one").is(void(0));
				});

				fifty.run(function inherited() {
					var converted = subject.Environment.run(set);
					var result = converted({ one: "two" });
					verify(result).evaluate.property("baz").is("bizzy");
					verify(result).evaluate.property("one").is("two");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		ssh: slime.jrunscript.shell.ssh.Exports
	}

	export interface Exports {
		inject: {
			httpd: (module: any) => void
		}
	}

	export namespace older {
		/**
		 * A fully-specified invocation of a command to be run in an external process.
		 */
		export interface Invocation {
			/**
			 * The command to run.
			 */
			command: string

			/**
			 * The arguments to pass to the command.
			 */
			arguments: string[]

			/**
			 * The environment to pass to the command.
			 */
			environment: invocation.Argument["environment"]

			/**
			 * The working directory to use when running the command.
			 */
			directory: slime.jrunscript.file.Directory

			stdio: invocation.old.Stdio
		}
	}

	(
		function(fifty: slime.fifty.test.Kit) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.listeners);
				fifty.run(fifty.tests.environment);

				fifty.run(fifty.tests.jsapi);

				fifty.run(fifty.tests.exports);

				fifty.load("run.fifty.ts");
				fifty.load("run-old.fifty.ts");

				fifty.load("console.fifty.ts");

				fifty.load("apple.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty)
}
