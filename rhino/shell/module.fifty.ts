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
			java: slime.jrunscript.host.Exports
			io: slime.jrunscript.io.Exports
			file: slime.jrunscript.file.Exports

			httpd: any

			js: slime.js.old.Exports

			/**
			 * The `js/document` module.
			 */
			document: any

			xml: {
				parseFile: (file: slime.jrunscript.file.File) => slime.runtime.document.exports.Document
			}
		}

		world?: {
			subprocess?: slime.jrunscript.shell.internal.run.Context["spi"]
		}
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
		export interface Subprocess {}
	}

	export interface Exports {
		subprocess: exports.Subprocess
	}

	export namespace exports {
		export interface Subprocess {
			Parent: {
				from: {
					process: () => slime.jrunscript.shell.run.Parent
				}
			}
			action: slime.$api.fp.world.Action<run.Intention,run.TellEvents>
			question: slime.$api.fp.world.Question<run.Intention,run.AskEvents,run.Exit>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const subject = jsh.shell;

				fifty.tests.manual.subprocess = {};

				fifty.tests.manual.subprocess.Parent = function() {
					var parent = subject.subprocess.Parent.from.process();
					jsh.shell.console(JSON.stringify(parent,void(0),4));
				}

				fifty.tests.manual.subprocess.Invocation = function() {
					var invocation = subject.subprocess.Invocation.from.intention(
						subject.subprocess.Parent.from.process()
					)({
						command: "ls"
					});
					jsh.shell.console(JSON.stringify(invocation));
				}

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
		Intention: exports.Intention
	}

	export namespace exports {
		export interface Intention {
			from: {
			}
		}
	}

	export interface Exports {
		listeners: $api.Events<{
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
		 * An object representing the environment provided via the {@link Context}, or representing the system environment if
		 * no environment was provided via the `Context`.
		 *
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
						document: void(0),
						httpd: void(0),
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

	export namespace run {
		export namespace old {
			export interface Argument extends invocation.old.Argument {
				as?: {
					user: string
				}

				on?: {
					start: (data: old.events.Events["start"]) => void
				}

				/** @deprecated */
				tokens?: any
				/** @deprecated */
				workingDirectory?: slime.jrunscript.file.Directory
				/** @deprecated */
				stdout?: invocation.old.Argument["stdio"]["output"]
				/** @deprecated */
				stdin?: invocation.old.Argument["stdio"]["input"]
				/** @deprecated */
				stderr?: invocation.old.Argument["stdio"]["error"]
			}

			export interface Result {
				command: any
				arguments: any[]
				environment: any

				directory: slime.jrunscript.file.Directory
				/** @deprecated */
				workingDirectory: slime.jrunscript.file.Directory

				status: number
				stdio?: run.CapturedOutput
			}

			export namespace events {
				export interface Event {
					command: slime.jrunscript.shell.invocation.old.Token
					arguments?: slime.jrunscript.shell.invocation.old.Token[]
					environment?: slime.jrunscript.shell.older.Invocation["environment"]
					directory?: slime.jrunscript.file.Directory
				}

				export interface Events {
					start: Event & {
						pid: number
						kill: () => void
					}

					terminate: Event & {
						status: number
						stdio?: slime.jrunscript.shell.run.CapturedOutput
					}
				}
			}

			export type Events = slime.$api.Events<events.Events>

			export type Handler = slime.$api.event.Handlers<events.Events>
		}
	}

	interface Result {
		stdio: {
			output: string
		}
	}

	export interface Exports {
		/**
		 * Launches a Java program.
		 */
		java: {
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

			jrunscript: any

			/**
			 * The home directory of the Java installation used to run this shell.
			 */
			home: slime.jrunscript.file.Directory
		}
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

			file(name: any): any
			directory(name: any): any
			searchpath: (name: string) => slime.jrunscript.file.Searchpath
		}

		TMPDIR: slime.jrunscript.file.Directory
		USER: string
		HOME: slime.jrunscript.file.Directory

		PWD: slime.jrunscript.file.Directory
		PATH?: slime.jrunscript.file.Searchpath

		os: {
			name: string
			arch: string
			version: string
			newline: string
			resolve: any

			process?: {
				list: slime.jrunscript.shell.system.ps
			}

			sudo?: slime.jrunscript.shell.system.sudo

			//	TODO	should not be using internal types
			ping?: slime.jrunscript.shell.internal.os.Exports["ping"]

			//	TODO	should not depend on jsh; need to disentangle jsh["ui"] from jsh first and have a separate TypeScript
			//			definition for something like slime.jrunscript.ui or something
			inject: (dependencies: { ui: slime.jsh.Global["ui"] }) => void
		}

		user: {
			downloads?: slime.jrunscript.file.Directory
		}

		jrunscript: slime.jrunscript.shell.oo.Run<
			Omit<slime.jrunscript.shell.run.old.Argument,"command"> & {
				jrunscript?: any
				properties?: any
				vmarguments?: string[]
			}
		>

		kotlin: any

		rhino: any

		world: World
	}

	export namespace system {
		export namespace apple {
			export namespace osx {
				/**
				 * An object specifying properties to be added to the `Info.plist`. Properties with string values will be
				 * treated as name-value pairs. Some properties allow non-string values, as specified below. The
				 * `CFBundlePackageType` property is hard-coded to `APPL`, per Apple's specification. The following
				 * properties are also required to be supplied, per Apple's documentation (although SLIME provides a default
				 * value for one):
				 */
				export interface ApplicationBundleInfo {
					/**
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html)
					 */
					CFBundleName: string

					/**
					 * Apple says this value is required, but it does not appear to be required.
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
					 */
					CFBundleDisplayName?: string

					/**
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
					 */
					CFBundleIdentifier: string

					/**
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
					 */
					CFBundleVersion: string

					/**
					 * (optional; defaults to `????`; see [Stack
					 * Overflow](http://stackoverflow.com/questions/1875912/naming-convention-for-cfbundlesignature-and-cfbundleidentifier).)
					 *
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
					 */
					CFBundleSignature?: string

					//	TODO	document allowed object type with command (preceding comment copied from JSAPI)
					/**
					 * See [Apple documentation](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html).
					 */
					CFBundleExecutable: string | { name?: string, command: string }

					//	Added to make test pass type checking; not sure what this does
					CFBundleIconFile?: any
				}

				export interface ApplicationBundle {
					directory: slime.jrunscript.file.Directory
					info: ApplicationBundleInfo
				}
			}
		}
	}

	export interface Exports {
		system: {
			apple: {
				plist: {
					xml: {
						encode: Function
						decode: Function
					}
				}
				osx: {
					/**
					 * Implements the creation of OS X [Application
					 * Bundles](https://developer.apple.com/library/mac/documentation/CoreFoundation/Conceptual/CFBundles/Introduction/Introduction.html).
					 */
					ApplicationBundle: new (p: {
						/**
						 * The location at which to create the bundle.
						 */
						pathname: slime.jrunscript.file.Pathname

						info: system.apple.osx.ApplicationBundleInfo
					}) => system.apple.osx.ApplicationBundle
				}
			}
			opendesktop: any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const subject = jsh.shell;

			fifty.tests.exports.system = function() {
				fifty.run(function applicationBundle() {
					if (subject.system.apple.osx.ApplicationBundle) {
						var tmpfile = jsh.shell.TMPDIR.createTemporary({ directory: true }).getRelativePath("tmp.icns");
						tmpfile.write("ICONS", { append: false });
						var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						tmp.directory.remove();
						var bundle = new subject.system.apple.osx.ApplicationBundle({
							pathname: tmp,
							info: {
								CFBundleName: "name",
								CFBundleIdentifier: "com.bitbucket.davidpcaldwell.slime",
								CFBundleVersion: "1",
								CFBundleExecutable: {
									name: "program",
									command: "ls"
								},
								CFBundleIconFile: {
									file: tmpfile.file
								}
							}
						});
						verify(bundle).directory.evaluate(String).is(tmp.directory.toString());
						verify(bundle).info.is.type("object");
						//	TODO	not sure what the below is for
						//@ts-ignore
						bundle.info = "foo";
						verify(bundle).info.is.type("object");
						verify(bundle).info.CFBundleName.is("name");
						verify(bundle).info.CFBundleIdentifier.is("com.bitbucket.davidpcaldwell.slime");
						verify(bundle).info.CFBundleVersion.is("1");
						verify(bundle).info.CFBundleExecutable.evaluate(String).is("program");
						verify(bundle).directory.getFile("Contents/MacOS/program").is.type("object");
						verify(bundle).directory.getFile("Contents/MacOS/executable").is.type("null");
						verify(bundle).directory.getFile("Contents/Resources/tmp.icns").is.type("object");

						bundle.info.CFBundleExecutable = "string";
						verify(bundle).info.CFBundleExecutable.evaluate(String).is("string");

						bundle.info.CFBundleExecutable = {
							name: "executable",
							command: "pwd"
						};
						verify(bundle).directory.getFile("Contents/MacOS/program").is.type("null");
						verify(bundle).directory.getFile("Contents/MacOS/executable").is.type("object");
						verify(bundle).directory.evaluate(function() {
							var file = this.getFile("Contents/MacOS/executable");
							if (!file) return null;
							return { string: file.read(String) };
						}).is.type("object");
					} else {
						var message = "ApplicationBundle not available on this system";
						verify(message).is(message);
					}
				})
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>;

	export namespace sudo {
		export interface Settings {
			nocache?: boolean
			askpass?: string | slime.jrunscript.file.File
		}
	}

	export interface Exports {
		Invocation: exports.Invocation
	}

	export interface World {
		/**
		 * @deprecated Replaced by the {@link Context} `world.subprocess` property, which allows a mock (or other) implementation to
		 * be used when loading the module. A mock implementation is provided in {@link slime.jrunscript.shell.test.Fixtures}.
		 *
		 * Allows a mock implementation of the `run` action to be created using a function that receives an invocation as an
		 * argument and returns an object describing what the mocked subprocess should do. The system will use this object to create
		 * the appropriate `Tell` and fire the appropriate events to the caller.
		 */
		mock: (delegate: (invocation: shell.run.old.Invocation) => shell.run.Mock) => slime.$api.fp.world.old.Action<run.old.Invocation,run.TellEvents>
	}

	export interface Exports {
		Tell: {
			exit: () => (tell: slime.$api.fp.world.old.Tell<run.TellEvents>) => run.TellEvents["exit"]
			mock: (stdio: Partial<Pick<slime.jrunscript.shell.run.StdioConfiguration,"output" | "error">>, result: slime.jrunscript.shell.run.Mock) => slime.$api.fp.world.old.Tell<slime.jrunscript.shell.run.TellEvents>
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
				this.api = {
					js: fifty.$loader.module("../../js/object/"),
					java: java,
					io: io,
					file: fifty.$loader.module("../../rhino/file/", new function() {
						if (jsh.shell.environment.PATHEXT) {
							this.pathext = jsh.shell.environment.PATHEXT.split(";");
						}
						this.$rhino = jsh.unit.$slime;
						this.api = {
							io: io,
							js: jsh.js,
							java: jsh.java
						};
						this.$pwd = String(jsh.shell.properties.object.user.dir);
						this.addFinalizer = jsh.loader.addFinalizer;
						//	TODO	below copy-pasted from rhino/file/api.html
						//	TODO	switch to use appropriate jsh properties, rather than accessing Java system properties directly
						var System = Packages.java.lang.System;
						if (System.getProperty("cygwin.root")) {
							this.cygwin = {
								root: String( System.getProperty("cygwin.root") )
							};
							if (System.getProperty("cygwin.paths")) {
								//	Using the paths helper currently does not seem to work in the embedded situation when running inside
								//	the SDK server
								//	TODO	check this
								this.cygwin.paths = String( System.getProperty("cygwin.paths") );
							}
						}
					}),
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

			var module = fixtures().load(context);

			var test = function(b) {
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

			fifty.tests.manual.process = {};
			fifty.tests.manual.process.list = function() {
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

	export interface Exports {
		test: {
			invocation: slime.jrunscript.shell.internal.invocation.Export
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject: slime.jrunscript.shell.internal.invocation.Export = fifty.global.jsh.shell.test.invocation;

			fifty.tests.invocation = fifty.test.Parent();

			fifty.tests.invocation.sudo = function() {
				var sudoed = subject.exports(void(0)).sudo({})(fifty.global.jsh.shell.Invocation.from.argument({
					command: "ls"
				}));

				fifty.verify(sudoed).configuration.command.evaluate(String).is("sudo");
				fifty.verify(sudoed).configuration.arguments[0].is("ls");
				fifty.verify(sudoed).context.environment.evaluate.property("SUDO_ASKPASS").is(void(0));
			};

			fifty.tests.invocation.toBashScript = function() {
				var parent = fifty.global.jsh.shell.environment;
				fifty.verify(parent).evaluate.property("PATH").is.type("string");
				fifty.verify(parent).evaluate.property("TO_BASH_SCRIPT_EXAMPLE").is(void(0));
				var script = subject.invocation.toBashScript()({
					command: "foo",
					arguments: ["bar", "baz"],
					directory: "/path/to/use",
					environment: {
						values: {
							PATH: null,
							TO_BASH_SCRIPT_EXAMPLE: "example"
						}
					}
				});
				var lines = script.split("\n");
				fifty.verify(lines[0]).is("#!/bin/bash");
				fifty.verify(lines[1]).is("cd /path/to/use");
				fifty.verify(lines[2]).is("env -u PATH TO_BASH_SCRIPT_EXAMPLE=\"example\" foo bar baz");
			}

			fifty.tests.invocation.suite = function() {
				fifty.run(function askpass() {
					var sudoed = subject.exports(void(0)).sudo({
						askpass: "/path/to/askpass"
					})(jsh.shell.Invocation.from.argument({
						command: "ls"
					}));

					verify(sudoed).configuration.command.evaluate(String).is("sudo");
					verify(sudoed).configuration.arguments[0].is("--askpass");
					verify(sudoed).configuration.arguments[1].is("ls");
					verify(sudoed).context.environment.SUDO_ASKPASS.is("/path/to/askpass");
				});
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.shell.internal.invocation {
	export interface Context {
		library: {
			io: slime.jrunscript.io.Exports
		}
	}
}

namespace slime.jrunscript.shell {
	export namespace invocation {
		export interface Stdio {
			input?: slime.jrunscript.runtime.io.InputStream
			output?: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
			error?: Omit<slime.jrunscript.runtime.io.OutputStream, "close">
		}

		export type Input = string | slime.jrunscript.runtime.io.InputStream

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
			/**
			 * The working directory in which the command will be executed. If not specified, this process's working directory
			 * will be provided.
			 */
			directory?: string

			stdio?: {
				input?: Input
				output?: run.OutputCapture
				error?: run.OutputCapture
			}
		}

		export namespace old {
			export type Token = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node

			export type OutputStreamToStream = slime.jrunscript.runtime.io.OutputStream
			export type OutputStreamToString = StringConstructor
			export type OutputStreamToLines = { line: (line: string) => void }
			export type OutputStreamConfiguration = OutputStreamToStream | OutputStreamToString | OutputStreamToLines

			/**
			 * Specifies the standard input, output, and error streams to use for an invocation.
			 *
			 * For the output streams:
			 * * if the global `String` object is used as the value, the stream's output will be captured as a string and returned along with the result of the subprocess.
			 * * if an object with a `line()` function is used as the value, the output will be buffered and the given object will receive a callback for each line of output.
			 *
			 * For the input stream:
			 * * if the value is a string, that string will be provided on the standard input stream for the subprocess.
			 */
			export interface Stdio {
				output?: OutputStreamConfiguration
				error?: OutputStreamConfiguration
				input?: Input
			}

			/**
			 * Type used by callers to specify {@link slime.jrunscript.shell.old.Invocation}s, without requiring boilerplate defaults; only the `command`
			 * property is required.
			 */
			export interface Argument {
				command: slime.jrunscript.shell.invocation.Argument["command"] | slime.jrunscript.file.Pathname | slime.jrunscript.file.File
				arguments?: Token[]
				environment?: slime.jrunscript.shell.invocation.Argument["environment"]
				directory?: slime.jrunscript.file.Directory

				/**
				 * The standard I/O streams to supply to the subprocess. If unspecified, or if any properties are unspecified,
				 * defaults will be used. The defaults are:
				 *
				 * * `input`: `null`
				 * * `output`: This process's standard output stream
				 * * `error`: This process's standard error stream
				 */
				stdio?: slime.jrunscript.shell.older.Invocation["stdio"]
			}
		}
	}

	export namespace exports {
		export interface Invocation {
			from: {
				argument: (p: invocation.Argument) => run.old.Invocation
			}

			/** @deprecated Use `from.argument`. */
			create: Invocation["from"]["argument"]

			//	TODO	probably should be conditional based on presence of sudo tool
			/**
			 * Given settings for `sudo`, converts an invocation into an equivalent invocation that will be run under `sudo`.
			 *
			 * @param settings A set of `sudo` settings.
			 * @returns An invocation that will run the given invocation under `sudo`.
			 */
			sudo: (settings: sudo.Settings) => slime.$api.fp.Transform<run.old.Invocation>

			handler: {
				stdio: {
					/**
					 * Creates an event handler that automatically buffers trailing blank lines, so that blank lines created by the
					 * end of a stream do not produce calls to the event handler.
					 */
					line: slime.$api.fp.Transform<slime.$api.event.Handler<slime.jrunscript.shell.run.Line>>
				}
			}
		}
	}

	export namespace bash {
		/**
		 * Specifies a complete subprocess environment; no environment variables will be inherited from the parent process.
		 */
		export type StandaloneEnvironment = {
			only: {
				[x: string]: string
			}
		}

		export type InheritedEnvironment = {
			/**
			 * Environment variables to be provided to the command, or to be removed from the environment of the command.
			 * Properties with string values represent variables to be provided to the command (potentially overriding
			 * values from the parent shell). Properties with `null` values represent variables to be **removed** from
			 * the command's environment (even if they are present in the parent shell). Properties that are undefined
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
		export type Environment = StandaloneEnvironment | InheritedEnvironment

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

			environment?: bash.Environment
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

			environment: {
				is: {
					standalone: (p: bash.Environment) => p is bash.StandaloneEnvironment
					inherited: (p: bash.Environment) => p is bash.InheritedEnvironment
				}

				/**
				 * Given a `bash.Environment`, provides a value suitable for use with {@link run.Intention}s.
				 */
				run: (p: bash.Environment) => run.Intention["environment"]
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
				var only: bash.StandaloneEnvironment = { only: { foo: "bar" } };
				var set: bash.InheritedEnvironment = { set: { baz: "bizzy" } };

				fifty.run(function standalone() {
					var converted = subject.bash.environment.run(only);
					var result = converted({ one: "two" });
					verify(result).evaluate.property("foo").is("bar");
					verify(result).evaluate.property("one").is(void(0));
				});

				fifty.run(function inherited() {
					var converted = subject.bash.environment.run(set);
					var result = converted({ one: "two" });
					verify(result).evaluate.property("baz").is("bizzy");
					verify(result).evaluate.property("one").is("two");
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		invocation: {
			 /**
			  * @deprecated Replaced by {@link Exports["bash"]["from"]["intention"]}.
			  *
			  * Creates the code for a `bash` script from a single Invocation-like object and returns it as a string.
			  */
			 toBashScript: () => (p: {
				/**
				 * The command to execute.
				 */
				command: string | slime.jrunscript.file.File

				/**
				 * Arguments to be sent to the command. If omitted, no arguments will be sent.
				 */
				arguments?: string[]

				/**
				 * The working directory to be used when executing the command. If omitted, the shell's current working directory
				 * will be used.
				 */
				directory?: string | slime.jrunscript.file.Directory

				/**
				 * Configuration of the environment for the command. If omitted, the command will inherit the environment of the
				 * invoking shell.
				 */
				environment?: {
					/**
					 * Whether to include the environment of the invoking shell. If `true`, the command's environment will include
					 * the environment of the invoking shell. Defaults to `true`.
					 */
					inherit?: boolean

					/**
					 * Environment variables to be provided to the command, or to be removed from the environment of the command.
					 * Properties with string values represent variables to be provided to the command (potentially overriding
					 * values from the parent shell). Properties with `null` values represent variables to be **removed** from
					 * the command's environment (even if they are present in the parent shell). Properties that are undefined
					 * will have no effect.
					 */
					values: {
						[x: string]: string | null
					}
				}
			 }) => string
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
}

namespace slime.jrunscript.shell.internal.invocation {
	export type Configuration = Pick<slime.jrunscript.shell.invocation.old.Argument, "command" | "arguments">

	export type StdioWithInputFixed = {
		input: slime.jrunscript.runtime.io.InputStream
		output: slime.jrunscript.shell.invocation.old.Stdio["output"]
		error: slime.jrunscript.shell.invocation.old.Stdio["error"]
	}

	export interface Export {
		exports: (defaults: shell.run.Parent) => slime.jrunscript.shell.exports.Invocation

		internal: {
			/**
			 * Interface that is exposed because the old `run` interface uses it; see `run-old.js`.
			 */
			old: {
				error: {
					BadCommandToken: slime.$api.error.old.Type<"ArgumentError",{}>
				}
				updateForStringInput: (p: slime.jrunscript.shell.invocation.old.Stdio) => slime.jrunscript.shell.internal.invocation.StdioWithInputFixed

				toStdioConfiguration: (declaration: slime.jrunscript.shell.internal.invocation.StdioWithInputFixed) => slime.jrunscript.shell.run.StdioConfiguration

				parseCommandToken: {
					(arg: slime.jrunscript.shell.invocation.old.Token, index?: number, ...args: any[]): string;
					Error: slime.$api.error.old.Type<"ArgumentError", {}>;
				}

				isLineListener: (p: slime.jrunscript.shell.invocation.old.OutputStreamConfiguration) => p is slime.jrunscript.shell.invocation.old.OutputStreamToLines
			}
		}

		invocation: slime.jrunscript.shell.Exports["invocation"]
	}

	(
		function(fifty: slime.fifty.test.Kit) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.listeners);
				fifty.run(fifty.tests.environment);

				fifty.run(fifty.tests.jsapi);

				fifty.run(fifty.tests.invocation);

				fifty.run(fifty.tests.exports);

				fifty.load("run.fifty.ts");
				fifty.load("run-old.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty)

	export type Script = slime.loader.Script<Context,Export>
}
