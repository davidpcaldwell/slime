//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.script {
	export namespace test {
		/**
		 * Represents the module inside the Fifty test suite.
		 */
		export const subject: Exports = (function(fifty: slime.fifty.test.Kit) {
			const jsh = fifty.global.jsh;
			const subject = jsh.script;
			return subject;
		//@ts-ignore
		})(fifty);

		export const shells: slime.jsh.test.Shells = (function(fifty: slime.fifty.test.Kit) {
			const script: slime.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
			return script().shells(fifty);
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * (contingent) The object representing the main file being executed.
		 * * In the case of an ordinary script, this is the script that was launched.
		 * * In the case of a packaged script, it is the package file (the `.jar` file).
		 * * In the case of a remote script, it is not present.
		 */
		file?: slime.jrunscript.file.File
	}

	export interface Exports {
		/**
		 * (contingent) The object representing the main script being executed by the shell. In the case of a packaged script, this
		 * value will be absent as the script is embedded in the package file itself. For remote scripts, the property is also
		 * absent.
		 */
		script?: slime.jrunscript.file.File
	}

	export interface Exports {
		/**
		 * @deprecated
		 *
		 * (contingent) The URL from which this script was loaded, if it is a remote script.
		 */
		url?: slime.web.Url
	}

	export interface Exports {
		/** @deprecated */
		pathname: any
		getRelativePath: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script = fifty.jsh.file.relative("../test/jsh-data.jsh.js");
			var scriptUrl = "http://raw.githubusercontent.com/davidpcaldwell/slime/local/jrunscript/jsh/test/jsh-data.jsh.js";

			//	TODO	these tests could be better; right now, they are based on shell type, rather than script type (which is what
			//			really matters, except in the case of packaged shells)

			const environmentWithJavaInPath: slime.$api.fp.Transform<slime.jrunscript.shell.run.Environment> = function(given) {
				var PATH = given.PATH.split(":");
				var home = jsh.shell.java.Jdk.from.javaHome();
				var insert = jsh.file.Pathname(home.base).directory.getRelativePath("bin").toString();
				//var insert = jsh.shell.java.home.getRelativePath("bin").toString();
				jsh.shell.console("Inserting: " + insert);
				PATH.splice(0,0,insert);
				jsh.shell.console("PATH = " + PATH.join(":"));
				return $api.Object.compose(
					given,
					{
						PATH: PATH.join(":")
					}
				)
			};

			type FileJson = {
				string: string
				pathname: { string: string }
			};

			type UrlJson = {
				string: string
			};

			var getShellDataJson: (intention: slime.jrunscript.shell.run.Intention) => { "jsh.script.file": FileJson, "jsh.script.script": FileJson, "jsh.script.url": UrlJson } = $api.fp.pipe(
				$api.fp.world.Sensor.mapping({
					sensor: jsh.shell.subprocess.question
				}),
				$api.fp.impure.tap(function(exit) {
					if (exit.status) {
						jsh.shell.console("Exit status: " + exit.status);
						jsh.shell.console("Standard error:");
						jsh.shell.console(exit.stdio.error);
						throw new Error("Exit status: " + exit.status);
					}
				}),
				$api.fp.property("stdio"),
				$api.fp.property("output"),
				JSON.parse
			);

			var getJshScriptFile: (intention: slime.jrunscript.shell.run.Intention) => FileJson = $api.fp.pipe(
				getShellDataJson,
				$api.fp.property("jsh.script.file")
			);

			var getJshScriptScript: (intention: slime.jrunscript.shell.run.Intention) => FileJson = $api.fp.pipe(
				getShellDataJson,
				$api.fp.property("jsh.script.script")
			);

			var getJshScriptUrl: (intention: slime.jrunscript.shell.run.Intention) => UrlJson = $api.fp.pipe(
				getShellDataJson,
				$api.fp.property("jsh.script.url")
			);

			fifty.tests.exports.oo = fifty.test.Parent();

			fifty.tests.exports.oo.main = fifty.test.Parent();

			fifty.tests.exports.oo.main.unbuilt = fifty.test.Parent();

			fifty.tests.exports.oo.main.unbuilt.local = function() {
				var run = test.shells.unbuilt().invoke({
					script: script.pathname,
					stdio: {
						output: "string"
					}
				});

				var fileProperty = $api.fp.now(
					run,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(
					run,
					getJshScriptScript
				);

				var urlProperty = $api.fp.now(
					run,
					getJshScriptUrl
				);

				verify(fileProperty).string.evaluate(String).is(script.pathname);
				verify(fileProperty).pathname.string.evaluate(String).is(script.pathname);
				verify(scriptProperty).string.evaluate(String).is(script.pathname);
				verify(scriptProperty).pathname.string.evaluate(String).is(script.pathname);
				verify(urlProperty).is(void(0));
			};

			fifty.tests.exports.oo.main.unbuilt.remote = function() {
				try {
					var online = test.shells.unbuilt().invoke({
						script: scriptUrl,
						stdio: {
							output: "string"
						}
					});
				} catch (e) {
					verify(false).is(true);
				}

				var fileProperty = $api.fp.now(
					online,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(online, getJshScriptScript);

				var urlProperty = $api.fp.now(
					online,
					getJshScriptUrl
				);

				verify(fileProperty).is(void(0));
				verify(scriptProperty).is(void(0));
				verify(urlProperty).string.is(scriptUrl);
			}

			fifty.tests.exports.oo.main.built = function() {
				var run = test.shells.built(false).invoke({
					script: script.pathname,
					environment: environmentWithJavaInPath,
					stdio: {
						output: "string"
					}
				});

				var fileProperty = $api.fp.now(
					run,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(
					run,
					getJshScriptScript
				);

				var urlProperty = $api.fp.now(
					run,
					getJshScriptUrl
				);

				verify(fileProperty).string.evaluate(String).is(script.pathname);
				verify(fileProperty).pathname.string.evaluate(String).is(script.pathname);
				verify(scriptProperty).string.evaluate(String).is(script.pathname);
				verify(scriptProperty).pathname.string.evaluate(String).is(script.pathname);
				verify(urlProperty).is(void(0));
			}

			fifty.tests.exports.oo.main.packaged = function() {
				var packaged = test.shells.packaged(script.pathname);
				var run = packaged.invoke({
					environment: environmentWithJavaInPath,
					stdio: {
						output: "string"
					}
				});

				var fileProperty = $api.fp.now(
					run,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(
					run,
					getJshScriptScript
				);

				var urlProperty = $api.fp.now(
					run,
					getJshScriptUrl
				);

				verify(fileProperty).string.evaluate(String).is(packaged.package);
				verify(fileProperty).pathname.string.evaluate(String).is(packaged.package);

				verify(scriptProperty).is(void(0));
				verify(urlProperty).is(void(0));
			}

			var remoteShellUrlScript = function(remote: jsh.test.shells.Remote, debug: boolean = false) {
				var run = remote.getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						//	TODO	throws exception if this is not set; should this be hard-coded upstream?
						branch: "local",
						debug: debug
					},
					script: scriptUrl
				});

				var fileProperty = $api.fp.now(
					run,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(
					run,
					getJshScriptScript
				);

				var urlProperty = $api.fp.now(
					run,
					getJshScriptUrl
				);

				verify(fileProperty).is(void(0));
				verify(scriptProperty).is(void(0));
				verify(urlProperty).string.is(scriptUrl);
			}

			var remoteShellFileScript = function(remote: jsh.test.shells.Remote) {
				var run = remote.getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						//	TODO	throws exception if this is not set; should this be hard-coded upstream?
						branch: "local"
					},
					script: script.pathname
				});

				var fileProperty = $api.fp.now(
					run,
					getJshScriptFile
				);

				var scriptProperty = $api.fp.now(
					run,
					getJshScriptScript
				);

				var urlProperty = $api.fp.now(
					run,
					getJshScriptUrl
				);

				verify(fileProperty).string.is(script.pathname);
				verify(fileProperty).pathname.string.is(script.pathname);
				verify(scriptProperty).string.is(script.pathname);
				verify(scriptProperty).pathname.string.is(script.pathname);
				verify(urlProperty).is(void(0));
			}

			fifty.tests.wip = function() {
				remoteShellUrlScript(test.shells.remote(), true);
			};

			fifty.tests.exports.oo.main.remote = function() {
				var remote = test.shells.remote();

				fifty.run(function url() {
					remoteShellUrlScript(remote);
				});

				fifty.run(function file() {
					remoteShellFileScript(remote);
				});
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/** @deprecated */
		addClasses: any
	}

	export interface Exports {
		/**
		 * An array containing the arguments passed to the shell.
		 */
		arguments: string[]
	}

	export interface Exports {
		/**
		 * An object that can be used to load code associated with this script. For packaged scripts, this object loads modules and
		 * files packaged with the script using the packaging tool. For unpackaged scripts, this object loads modules and files
		 * relative to the directory from which the script was run (although a script can replace this property; see `
		 * `Loader`).
		 */
		loader: slime.old.Loader
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script = fifty.jsh.file.relative("test/loader.jsh.js");
			var scriptUrl = "http://raw.githubusercontent.com/davidpcaldwell/slime/local/jrunscript/jsh/script/test/loader.jsh.js";

			var getJson: (intention: slime.jrunscript.shell.run.Intention) => { submodule: { message: string } } = $api.fp.pipe(
				$api.fp.world.Sensor.mapping({
					sensor: jsh.shell.subprocess.question
				}),
				$api.fp.impure.tap(function(exit) {
					if (exit.status) {
						jsh.shell.console("Exit status: " + exit.status);
						jsh.shell.console("Standard error:");
						jsh.shell.console(exit.stdio.error);
						throw new Error("Exit status: " + exit.status);
					}
				}),
				$api.fp.property("stdio"),
				$api.fp.property("output"),
				JSON.parse
			);

			fifty.tests.exports.loader = fifty.test.Parent();

			fifty.tests.exports.loader.shape = function() {
				verify(test.subject).evaluate.property("loader").evaluate.property("get").is.type("function");
			}

			fifty.tests.exports.loader.jsapi = function() {
				var local = test.shells.unbuilt().invoke({
					script: script.pathname,
					stdio: {
						output: "string"
					}
				});

				var json = getJson(local);

				verify(json).submodule.message.is("ititit");

				var remote = test.shells.unbuilt().invoke({
					script: scriptUrl,
					stdio: {
						output: "string"
					}
				});

				var json = getJson(remote);

				verify(json).submodule.message.is("ititit");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		/**
		 * Creates a {@link Loader} that loads from a location relative to this script.
		 *
		 * @param path A path which will be interpreted relative to this script's location.
		 *
		 * @returns A {@link Loader} that loads code from the location indicated by `path`.
		 */
		Loader?: (path: string) => slime.old.Loader
	}

	export interface Exports {
		Application: slime.jsh.script.old.application.Constructor & {
			/**
			 * Creates and executes an Application using a descriptor. Arguments can optionally be supplied; otherwise, the global
			 * script arguments will be used.
			 *
			 * @param descriptor A descriptor describing an application.
			 * @param arguments (optional; if omitted, `jsh.script.arguments`) An array of arguments to pass to the application.
			 * @returns The value returned by the command executed.
			 */
			run: (
				descriptor: slime.jsh.script.old.application.Descriptor,
				arguments?: string[]
			) => any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script = fifty.jsh.file.relative("test/Application.jsh.js");
			var shells = test.shells;

			fifty.tests.exports.Application = function() {
				var intention = shells.unbuilt().invoke({
					script: script.pathname,
					arguments: ["-gstring", "gvalue", "-gboolean", "doIt", "-lboolean"],
					stdio: {
						output: "string"
					}
				});

				var getJson = $api.fp.pipe(
					$api.fp.world.Sensor.mapping({ sensor: jsh.shell.subprocess.question }),
					$api.fp.property("stdio"),
					$api.fp.property("output"),
					JSON.parse
				);

				var json = getJson(intention) as {
					global: { gstring: string, gboolean: boolean }
					options: { lboolean: boolean, lstring: string }
				};

				verify(json).global.gstring.is("gvalue");
				verify(json).global.gboolean.is(true);
				verify(json).options.lboolean.is(true);
				verify(json).options.lstring.is("foo");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		world: {
			file: slime.jrunscript.file.world.Location
		}
	}

	/**
	 * Provides APIs supporting command-line `jsh` applications.
	 *
	 * ## CLI applications with commands
	 *
	 * The simplest way to define a CLI application with commands - in other words, applications invoked using the main script and
	 * a command name, where each command defines its own arguments - is using the
	 * {@link slime.jsh.script.cli.Exports#program | jsh.script.cli.program()} method, providing a
	 * {@link slime.jsh.script.cli.Commands} object as the `commands` property; the function produced is a
	 * {@link slime.jsh.script.cli.main | `main` implementation}.
	 */
	export namespace cli {
		export interface Invocation<T> {
			options: T
			arguments: string[]
		}

		export interface Processor<T,R> {
			(invocation: Invocation<T>): Invocation<R>
		}

		/**
		 * A process that may return a numeric exit status that can be used as a process exit status, or may complete normally, or
		 * may throw an uncaught exception.
		 */
		export interface Command<T = {}> {
			(invocation: Invocation<T>): number | void
		}

		export interface Commands<T = {}> {
			[x: string]: Commands<T> | Command<T>
		}

		export interface Descriptor<T> {
			options?: Processor<{},T>
			commands: Commands<T>
		}

		export interface Call<T> {
			command: Command<T>
			invocation: Invocation<T>
		}

		export type CallSearchResult<T> = Call<T>
			| slime.jsh.script.cli.error.NoTargetProvided
			| slime.jsh.script.cli.error.TargetNotFound
			| slime.jsh.script.cli.error.TargetNotFunction
	}

	export interface Exports {
		cli: cli.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.cli = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace cli {
		export interface Exports {
			Call: {
				parse: <T>(p: {
					commands: Commands<T>
					invocation: Invocation<T>
				}) => CallSearchResult<T>

				get: <T>(p: {
					descriptor: Descriptor<T>
					arguments: string[]
				}) => CallSearchResult<T>

				execute: <T>(p: {
					commands: Commands<T>
					call: CallSearchResult<T>
				}) => never | void
			}

			execute: <T>(p: {
				commands: Commands<T>
				invocation: Invocation<T>
			}) => never | void
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify, run } = fifty;
				const { $api, jsh } = fifty.global;

				var hello = function(p) {
				};

				fifty.tests.cli.Call = function() {
					var commands: Commands<{}> = {
						hello: hello
					};

					run(function parse() {
						var one = test.subject.cli.Call.parse({
							commands: commands,
							invocation: {
								options: {},
								arguments: ["hello"]
							}
						}) as slime.jsh.script.cli.Call<{}>;

						verify(one).evaluate.property("command").is(hello);
						verify(one).invocation.options.is.type("object");
						verify(one).invocation.arguments.length.is(0);

						var two = test.subject.cli.Call.parse({
							commands: commands,
							invocation: {
								options: {},
								arguments: ["hello", "world"]
							}
						}) as slime.jsh.script.cli.Call<{}>;

						verify(two).evaluate.property("command").is(hello);
						verify(two).invocation.options.is.type("object");
						verify(two).invocation.arguments.length.is(1);
						verify(two).invocation.arguments[0].is("world");
					});

					run(function get() {
						var descriptor = {
							commands: commands
						};

						var one = test.subject.cli.Call.get({
							descriptor: descriptor,
							arguments: ["hello"]
						}) as slime.jsh.script.cli.Call<{}>;

						verify(one).evaluate.property("command").is(hello);
						verify(one).invocation.options.is.type("object");
						verify(one).invocation.arguments.length.is(0);

						var two = test.subject.cli.Call.get({
							descriptor: descriptor,
							arguments: ["hello", "world"]
						}) as slime.jsh.script.cli.Call<{}>;

						verify(two).evaluate.property("command").is(hello);
						verify(two).invocation.options.is.type("object");
						verify(two).invocation.arguments.length.is(1);
						verify(two).invocation.arguments[0].is("world");
					});
				};
			}
		//@ts-ignore
		)(fifty);

	}

	export namespace cli {
		export type Option<N extends String,T> = { longname: N }
		export type OptionWithDefault<N extends string,T> = { longname: N, default?: T }
		export type OptionWithElse<N extends string,T> = { longname: N, else: slime.$api.fp.Thunk<T> }

		export type OptionParser<T> = <O extends object,N extends string>
			(c: Option<N,T> | OptionWithDefault<N,T> | OptionWithElse<N,T> )
			=> (i: cli.Invocation<O>)
			=> cli.Invocation<O & { [n in N]: T }>

		export interface Exports {
			option: {
				string: OptionParser<string>
				boolean: OptionParser<boolean>
				number: OptionParser<number>

				pathname: OptionParser<slime.jrunscript.file.Pathname>

				array: <O extends object,N extends keyof any,T>(c: { longname: N, value: (s: string) => T })
					=> (i: cli.Invocation<O>)
					=> cli.Invocation<O & { [n in N]: T[] }>

				map: <O extends object,N extends keyof any,T>(c: { longname: N, value: (s: string) => T })
					=> (i: cli.Invocation<O>)
					=> cli.Invocation<O & { [n in N]: { [k: string]: T } }>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.cli.option = function() {
					const subject = test.subject;

					var invoked = $api.fp.result(
						{
							options: {},
							arguments: ["--foo", "bar", "--baz", 42]
						},
						$api.fp.pipe(
							subject.cli.option.string({ longname: "foo" }),
							subject.cli.option.number({ longname: "baz" })
						)
					);
					verify(invoked).options.foo.is("bar");
					verify(invoked).options.baz.is(42);

					var trial = function(p: cli.Processor<any,any>, args: string[]) {
						return p({
							options: {},
							arguments: args
						});
					}

					fifty.run(function string() {
						var one = trial(subject.cli.option.string({ longname: "a" }), []);
						var two = trial(subject.cli.option.string({ longname: "a" }), ["--a", "foo"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is("foo");
					});

					//	TODO	number is tested below in defaults, but not on its own

					//	TODO	pathname is not tested explicitly

					fifty.run(function defaults() {
						var noDefault = subject.cli.option.number({ longname: "a" });
						var withDefault = subject.cli.option.number({ longname: "a", default: 2 });

						var one = trial(noDefault, []);
						var two = trial(noDefault, ["--a", "1"]);
						var three = trial(withDefault, []);
						var four = trial(withDefault, ["--a", "1"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is(1);
						fifty.verify(three).options.evaluate.property("a").is(2);
						fifty.verify(four).options.evaluate.property("a").is(1);
					});

					fifty.run(function elses() {
						var noDefault = subject.cli.option.number({ longname: "a" });
						var withDefault = subject.cli.option.number({ longname: "a", else: function() { return 2; } });

						var one = trial(noDefault, []);
						var two = trial(noDefault, ["--a", "1"]);
						var three = trial(withDefault, []);
						var four = trial(withDefault, ["--a", "1"]);

						fifty.verify(one).options.evaluate.property("a").is(void(0));
						fifty.verify(two).options.evaluate.property("a").is(1);
						fifty.verify(three).options.evaluate.property("a").is(2);
						fifty.verify(four).options.evaluate.property("a").is(1);
					});

					var invocation: cli.Invocation<{ a: string, b: number[], c: string }> = {
						options: {
							a: void(0),
							b: [],
							c: void(0)
						},
						arguments: ["--a", "A", "--b", "1", "--b", "3", "--c", "C"]
					};
					fifty.verify(invocation).options.b.length.is(0);

					var processor: cli.Processor<{ a: string, b: number[], c: string }, { a: string, b: number[], c: string }> = subject.cli.option.array({
						longname: "b",
						value: Number
					});

					var after: cli.Invocation<{ a: string, b: number[], c: string }> = processor(invocation);
					fifty.verify(after).options.b.length.is(2);
					fifty.verify(after).options.b[0].is(1);
					fifty.verify(after).options.b[1].is(3);
					fifty.verify(after).arguments[0].is("--a");
					fifty.verify(after).arguments[1].is("A");
					fifty.verify(after).arguments[2].is("--c");
					fifty.verify(after).arguments[3].is("C");

					fifty.run(function harvestedFromWf() {
						fifty.run(
							function() {
								var invocation = {
									options: {},
									arguments: ["--foo", "bar"]
								};
								subject.cli.option.string({
									longname: "baz"
								})(invocation);
								verify(invocation).options.evaluate.property("foo").is(void(0));
								verify(invocation).arguments.length.is(2);
							}
						);

						fifty.run(
				 			function() {
								var invocation = {
									options: {},
									arguments: ["--foo", "bar"]
								};
								subject.cli.option.string({
									longname: "foo"
								})(invocation);
								verify(invocation).options.evaluate.property("foo").is("bar");
								verify(invocation).arguments.length.is(0);
							}
						);

						fifty.run(
				 			function() {
								var invocation = {
									options: {
										baz: false
									},
									arguments: ["--baz", "--bizzy"]
								};
								subject.cli.option.boolean({
									longname: "baz"
								})(invocation);
								verify(invocation).options.baz.is(true);
								verify(invocation).options.evaluate.property("bizzy").is(void(0));
								verify(invocation).arguments.length.is(1);
								verify(invocation).arguments[0].is("--bizzy");
							}
						);

						fifty.run(
				 			function() {
								var processor = $api.fp.pipe(
									subject.cli.option.string({ longname: "a" }),
									subject.cli.option.boolean({ longname: "b" }),
									subject.cli.option.string({ longname: "aa" }),
									subject.cli.option.boolean({ longname: "bb" })
								)
								var invocation = processor({
									options: {},
									arguments: ["--a", "aaa", "--b", "--c", "c"]
								});
								verify(invocation).arguments.length.is(2);
								verify(invocation).arguments[0] == "--c";
								verify(invocation).arguments[1] == "c";
								verify(invocation).options.a.is("aaa");
								verify(invocation).options.b.is(true);
								verify(invocation).options.evaluate.property("aa").is(void(0));
								verify(invocation).options.evaluate.property("bb").is(void(0));
							}
						);

						fifty.run(
							function() {
								var processor = $api.fp.pipe(
									subject.cli.option.array({ longname: "word", value: $api.fp.identity }),
									subject.cli.option.array({ longname: "factor", value: Number }),
									subject.cli.option.map({ longname: "mapping", value: $api.fp.identity }),
									subject.cli.option.map({ longname: "ascii", value: Number })
								);

								var invocation = {
									options: {},
									arguments: [
										"--word", "foo",
										"--factor", "2",
										"--mapping", "x=X",
										"--factor", "3",
										"--ascii", "A=65",
										"--mapping", "y=Y",
										"--ascii", "C=67",
										"--ascii", "E=69"
									]
								};

								var after = $api.fp.now(invocation, processor);

								verify(after).options.word.length.is(1);
								verify(after).options.word[0].is("foo");

								verify(after).options.factor.length.is(2);
								verify(after).options.factor[0].is(2);
								verify(after).options.factor[1].is(3);

								verify(after).options.mapping.evaluate(Object.keys).length.is(2);
								verify(after).options.mapping.evaluate($api.fp.property("x")).is("X");
								verify(after).options.mapping.evaluate($api.fp.property("y")).is("Y");

								verify(after).options.ascii.evaluate(Object.keys).length.is(3);
								verify(after).options.ascii.A.is(65);
								verify(after).options.ascii.C.is(67);
								verify(after).options.ascii.E.is(69);
							}
						)
					})
				};
			}
		//@ts-ignore
		)(fifty);

		export namespace fp {
			export type OptionParser<T> = <O extends object,N extends string>(c: { longname: N })
				=> (i: cli.Invocation<O>)
				=> cli.Invocation<O & { [n in N]: slime.$api.fp.Maybe<T> }>
		}

		export interface Exports {
			fp: {
				option: {
					location: fp.OptionParser<slime.jrunscript.file.Location>
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				fifty.tests.cli.fp = fifty.test.Parent();

				fifty.tests.cli.fp.option = function() {
					var relative = fifty.global.$api.fp.now.invoke(
						fifty.global.jsh.shell.PWD.pathname.os.adapt(),
						fifty.global.jsh.file.Location.directory.relativePath("bar")
					);
					var fallback = fifty.jsh.file.relative("foo");
					var at = test.subject.cli.fp.option.location({ longname: "at" });
					var atDefault = fifty.global.$api.fp.impure.Input.value(fallback);

					var withArgs = function(a: string[]): cli.Invocation<{}> { return { options: {}, arguments: a }};

					var one = at(withArgs([])).options.at;
					verify(one).present.is(false);

					var two = at(withArgs(["--at", "bar"])).options.at;
					verify(two).present.is(true);
					if (two.present) {
						verify(two).value.pathname.is(relative.pathname);
					}

					var three = $api.fp.impure.Input.from.partial({
						if: $api.fp.impure.Input.value(at(withArgs([])).options.at),
						else: atDefault
					});
					verify(three()).pathname.is(fallback.pathname);
					var four = $api.fp.impure.Input.from.partial({
						if: $api.fp.impure.Input.value(at(withArgs(["--at", "bar"])).options.at),
						else: atDefault
					});
					verify(four()).pathname.is(relative.pathname);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace cli {
		export namespace error {
			export type NoTargetProvided = slime.$api.error.old.Instance<"NoTargetProvided",{}>
			export type TargetNotFound = slime.$api.error.old.Instance<"TargetNotFound", { command: string }>
			export type TargetNotFunction = slime.$api.error.old.Instance<"TargetNotFunction", { command: string, target: any }>
		}

		/**
		 * @experimental
		 *
		 * Currently, a value of this type is provided to the top-level `jsh` script's scope as `main`.
		 */
		export type main = (program: Program) => void

		export interface Exports {
			/**
			 * Invoking this function allows the declaration of a main function for this script of type {@link Program}, which can
			 * be created using functional techniques.
			 */
			main: main

			listener: (callback: main) => void
		}

		export interface Exports {
			error: {
				//	TODO	switch to new APIs
				NoTargetProvided: $api.error.old.Type<"NoTargetProvided",{}>
				TargetNotFound: $api.error.old.Type<"TargetNotFound", { command: string }>
				TargetNotFunction: $api.error.old.Type<"TargetNotFunction", { command: string, target: any }>
			}

			parser: {
				/**
				 * Resolves a command-line argument of type `Pathname`.
				 *
				 * @param argument A string, presumably provided by a command-line invoker
				 * @returns A full `Pathname` representing the provided string, resolving relative paths as needed.
				 */
				pathname: (argument: string) => slime.jrunscript.file.Pathname
			}

			/**
			 * Parses the `jsh` shell's arguments using the given {@link Processor}, returning the result of the processing.
			 */
			invocation: <T,R>(processor: cli.Processor<T,R>) => cli.Invocation<R>

			run: (command: slime.jsh.script.cli.Command<{}>) => never

			//	TODO	harvest the below documentation if it has useful writing
			// /**
			//  * Given a {@link Descriptor} implementing the application's global options and commands, returns an object capable of
			//  * invoking a {@link Command} with an appropriate {@link Invocation}. Options provided by the `Descriptor` will be processed into
			//  * an `Invocation`,
			//  * and the first remaining argument will be interpreted as a command name. If the command name exists and is a function,
			//  * it will be invoked with the {@link Invocation}.
			//  */
			// Application: (p: cli.Descriptor<any>) => cli.Application

			/**
			 * Executes the program with the given descriptor inside this shell, with the arguments of the shell, and exits the
			 * shell with the exit status indicated by the {@link Command}. If the `Command` returns a numeric exit status, it is
			 * used; otherwise, finishing execution successfully exits with 0 exit status and an uncaught exception exits with
			 * status 1.
			 */
			wrap: (descriptor: cli.Descriptor<any>) => void
		}

		export type Program = (invocation: slime.jsh.script.cli.Invocation<{}>) => number | void

		export interface Exports {
			program: <T = {}>(p: {
				commands: Commands<T>
			}) => Program
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.cli.invocation = function() {
				const subject = test.subject;

				var parser = fifty.global.$api.fp.pipe(
					subject.cli.option.string({ longname: "foo" })
				);
				var was = fifty.global.jsh.unit.$slime;
				debugger;
				var mocked = fifty.jsh.plugin.mock({
					$loader: void(0),
					jsh: fifty.global.jsh,
					plugins: {
						//	This is needed to load the plugin, although this is obviously a very skeletal mock of the
						//	jrunscript.shell module
						shell: {}
					},
					$slime: Object.assign({}, was, {
						getPackaged: function() { return null; },
						/** @return { slime.jrunscript.native.inonit.script.jsh.Shell.Invocation } */
						getInvocation: function() {
							return {
								getScript: function() {
									return was.getInvocation().getScript();
								},
								getArguments: function() {
									return ["--foo", "bar"]
								}
							};
						}
					})
				});
				var result: { options: { foo: string }, arguments: string[] } = mocked.jsh.script.cli.invocation(parser);
				fifty.verify(result).options.foo.is("bar");
				fifty.verify(result).arguments.length.is(0);
			};

			fifty.tests.cli.run = function() {
				const $api = fifty.global.$api;
				const subject = test.subject;

				var was: cli.Invocation<any>;
				var invocationWas = function(invocation: cli.Invocation<any>) {
					was = invocation;
				}
				var call = subject.cli.Call.get({
					descriptor: {
						options: subject.cli.option.string({ longname: "global" }),
						commands: {
							universe: $api.fp.pipe(
								subject.cli.option.string({ longname: "command" }),
								function(invocation) {
									invocationWas(invocation);
									return 42;
								}
							)
						}
					},
					arguments: ["--global", "foo", "universe", "--command", "bar"]
				}) as cli.Call<{}>;
				fifty.verify(call).command(call.invocation).evaluate(function(n) { return n as number; }).is(42);
				fifty.verify(was).options.evaluate.property("global").is("foo");
				fifty.verify(was).options.evaluate.property("command").is("bar");

				fifty.run(
					function() {
						var call = subject.cli.Call.get({
							descriptor: {
								commands: {
									foo: function nothing(){}
								}
							},
							arguments: ["foo"]
						}) as cli.Call<{}>;
						fifty.verify(call).command(call.invocation).is.type("undefined");
					}
				);

				fifty.run(
					function() {
						var call = subject.cli.Call.get({
							descriptor: {
								commands: {
									foo: function error() {
										throw new Error();
									}
								}
							},
							arguments: ["foo"]
						}) as cli.Call<{}>;
						fifty.verify(call).evaluate(function(call) { return call.command(call.invocation); }).threw.type(Error);
					}
				);
			};

			fifty.tests.cli.wrap = function() {
				const $api = fifty.global.$api;
				var result: { status: number } = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: ["status"],
					evaluate: $api.fp.identity
				});
				fifty.verify(result).status.is(0);

				result = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: ["status", "42"],
					evaluate: $api.fp.identity
				});
				fifty.verify(result).status.is(42);

				result = fifty.global.jsh.shell.jsh({
					shell: fifty.global.jsh.shell.jsh.src,
					script: fifty.jsh.file.object.getRelativePath("test/cli.jsh.js").file,
					arguments: [],
					evaluate: $api.fp.identity
				});
				fifty.verify(result).status.is(1);
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.load("getopts.fifty.ts");
				fifty.load("Application.fifty.ts");

				fifty.run(fifty.tests.cli);
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jsh.script.internal {
	export interface Source {
		file: slime.jrunscript.file.File
		uri: string
		packaged: {
			file: slime.jrunscript.file.File
			loader: slime.old.Loader
		}
	}

	export interface Context extends Source {
		api: {
			js: slime.$api.old.Exports
			web: slime.web.Exports
			file: slime.jrunscript.file.Exports
			http: () => slime.jsh.Global["http"]
			addClasses: (pathname: slime.jrunscript.file.Pathname) => void
			parser: slime.jsh.script.cli.Exports["parser"]
		}
		directory: slime.jrunscript.file.Directory
		arguments: string[]
	}
}
