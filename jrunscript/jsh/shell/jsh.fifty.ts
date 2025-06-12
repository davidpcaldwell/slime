//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell {
	export namespace internal {
		export interface Context {
			exit: any
			stdio: any
			_getSystemProperties: () => slime.jrunscript.native.java.util.Properties

			/**
			 * Provides access to the shell's subshell implementation, allowing a new shell to be invoked within the same process.
			 */
			jsh: (configuration: slime.jrunscript.native.inonit.script.jsh.Shell.Environment, script: slime.jrunscript.file.File, arguments: string[]) => number

			packaged: slime.$api.fp.impure.Input<slime.$api.fp.Maybe<string>>

			api: {
				js: any
				java: slime.jrunscript.java.Exports
				io: slime.jrunscript.io.Exports
				file: slime.jrunscript.file.Exports
				script: slime.jsh.script.Exports
				bootstrap: slime.internal.jrunscript.bootstrap.Api<{}>
			}

			PATH: slime.jrunscript.file.Searchpath

			module: slime.jrunscript.shell.Exports
		}

		export type Exports = Omit<slime.jsh.shell.Exports,"tools">

		export type Script = slime.loader.Script<Context,slime.jsh.shell.Exports>
	}

	export namespace test {
		export const shells = (function(fifty: slime.fifty.test.Kit) {
			const script: slime.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
			return script().shells(fifty);
		//@ts-ignore
		})(fifty);
	}

	/**
	 * An implementation of {@link slime.jrunscript.shell.Exports} that adds additional APIs that are available when running under
	 * the `jsh` shell.
	 */
	export interface Exports {}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();

			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * The JavaScript engine executing the loader process for the shell, e.g., `rhino`, `nashorn`.
		 */
		engine: string
	}

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * Exits from this shell. This ordinarily terminates the process, although some shells (for example, those launched by the
		 * `jsh.shell.jsh` method) can sometimes be run in-process.
		 *
		 * @param code The exit code to return to the parent, which is ordinarily an operating system process.
		 */
		exit: (code: number) => never
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.exports.exit = function() {
				var intention = test.shells.unbuilt().invoke({
					//	TODO	shouldn't this script be here?
					script: fifty.jsh.file.relative("test/exit.jsh.js").pathname
				});
				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: intention
				});
				fifty.verify(result).status.is(3);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * The standard I/O streams for this shell.
		 */
		stdio: {
			//	TODO	originally this supported methods of Reader also, should it?
			input: slime.jrunscript.runtime.io.InputStream
			output: slime.jrunscript.shell.context.Console
			error: slime.jrunscript.shell.context.Console
		}

		/** @deprecated Use {@link Exports["stdio"]["input"]} */
		stdin: Exports["stdio"]["input"]
		/** @deprecated Use {@link Exports["stdio"]["output"]} */
		stdout: Exports["stdio"]["output"]
		/** @deprecated Use {@link Exports["stdio"]["error"]} */
		stderr: Exports["stdio"]["error"]
	}

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * Writes a message to the shell's standard output stream, followed by a line terminator.
		 */
		echo: slime.jrunscript.shell.Console

		/**
		 * Writes a message to the console (as represented by the shell's standard error stream), followed by a line terminator.
		 */
		console: slime.jrunscript.shell.Console

		//	TODO	migrate jrunscript/jsh/test/manual/issue87.jsh.js here
		/**
		 * @deprecated Can use `jsh.shell.echo`, `jsh.shell.console`, or use stream APIs to write to other streams
		 *
		 * Writes a message to the console, or to another specified destination.
		 *
		 * @param message A message to echo.
		 * @param mode (optional) Specifies a destination. The `stream` property specifies a stream to which to write
		 * messages.
		 */
		println: (
			message: string,
			mode: {
				/**
				 * A destination stream for messages.
				 */
				stream: any
			}
		) => void
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const module = fifty.global.jsh.shell;

			fifty.tests.exports.println = function() {
				var buffer = new jsh.io.Buffer();
				var stream = buffer.writeText();

				//@ts-ignore
				module.println(true, { stream: stream });

				buffer.close();
				// TODO: hard-coded line terminator below
				var buffered = buffer.readText().asString().split("\n");
				verify(buffered).length.is(2);
				verify(buffered)[0].is("true");
				verify(buffered)[1].is("");
			}
		}
	//@ts-ignore
	)(fifty);

	export namespace old {
		export namespace shell {
			export interface Argument<T> {
				/**
				 * The executable to run, or its location
				 */
				command: slime.jrunscript.file.File | slime.jrunscript.file.Pathname | string

				/**
				 * An array containing strings and/or {@link slime.jrunscript.file.Pathname} objects.
				 */
				arguments: (string | slime.jrunscript.file.Pathname)[]

				/**
				 * If present, all arguments of type {@link slime.jrunscript.file.Pathname} are converted into pathnames in this
				 * filesystem before the subprocess is launched.
				 */
				filesystem?: {
					java: {
						adapt: (file: slime.jrunscript.native.java.io.File) => slime.jrunscript.file.Pathname
					}
				}

				/**
				 * An object containing the environment to send to the subprocess. If `null` or `undefined`, the subprocess will
				 * inherit this process's environment.
				 */
				environment?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["environment"]
				stdio?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["stdio"]

				/**
				 * A directory that will be used as the current working directory for the subprocess.
				 */
				directory?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["directory"]

				workingDirectory?: Parameters<slime.jrunscript.shell.Exports["run"]>[0]["directory"]

				evaluate?: slime.jrunscript.shell.run.old.evaluate<T>

				/**
				 * A callback function that will be invoked when the subprocess exits. The function will be invoked with an argument
				 * containing information about the subprocess.
				 */
				onExit?: slime.jrunscript.shell.run.old.evaluate<T>
			}
		}
	}

	export namespace exports.shell {
		export type Mode = Omit<old.shell.Argument<any>,"command"|"arguments">
	}

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * @deprecated Replaced by `run`.
		 *
		 * Launches a subprocess of this process to execute a specified command with specified arguments.
		 *
		 * By default, the standard input, standard output, standard error, and working directory will be inherited from this
		 * process, unless overridden by the mode argument.
		 */
		shell: {
			(p: old.shell.Argument<any>): any

			/**
			 * @param command The command to run
			 * @param args The arguments to pass to the subprocess
			 */
			(command: string, args: string[], mode: exports.shell.Mode): any
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const module = fifty.global.jsh.shell;

			const test = function(b: boolean) {
				fifty.verify(b).is(true);
			}

			fifty.tests.exports.shell = function() {
				var launcher = module.java.home.getFile("bin/java");
				if (!launcher) launcher = module.java.home.getFile("bin/java.exe");
				if (!launcher) throw new Error("Could not find Java launcher under " + module.java.home);
				var success = module.shell({
					command: launcher,
					arguments: ["-version"],
					evaluate: function(result) {
						return (result.status == 0) ? "success" : "failure";
					}
				});
				test(success == "success");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface JshShellJsh {
	}

	export interface Exports {
		jsh: JshInvoke & JshShellJsh
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports.jsh = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export interface UnbuiltInstallation {
		src: string
	}

	export interface BuiltInstallation {
		home: string
	}

	export interface PackagedInstallation {
		package: string
	}

	export interface UrlInstallation {
		url: string
	}

	export type ExternalInstallation = UnbuiltInstallation | BuiltInstallation | UrlInstallation

	export type Installation = ExternalInstallation | PackagedInstallation

	export type ExternalInstallationProgram = {
		shell: ExternalInstallation,
		script: string
	}

	export type Program = ExternalInstallationProgram | PackagedInstallation

	export type Intention = (
		Program
		& Pick<slime.jrunscript.shell.run.Intention,"arguments" | "environment" | "directory">
		& {
			properties?: slime.jrunscript.java.Properties
		}
		& Pick<slime.jrunscript.shell.run.Intention,"stdio">
	)

	export interface JshShellJsh {
		Installation: {
			from: {
				/**
				 * @experimental
				 *
				 * Returns the `jsh` installation that is running the current shell. Only implemented for unbuilt shells currently.
				 */
				current: slime.$api.fp.Thunk<Installation>
			}

			is: {
				unbuilt: (p: Installation) => p is UnbuiltInstallation
				packaged: (p: Installation) => p is PackagedInstallation
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.exports.jsh.Installation = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from.current = fifty.test.Parent();

			var getInstallationFromDiagnosticOutput: (data: any) => slime.jsh.shell.Installation = $api.fp.property("installation");

			var getInstallationFromShellIntention = $api.fp.pipe(
				$api.fp.world.Sensor.old.mapping({ sensor: jsh.shell.subprocess.question }),
				function(result) {
					if (result.status != 0) throw new Error(
						"Status: " + result.status
						+ "\n" + "Standard output:"
						+ "\n" + result.stdio.output
						+ "\n" + "Standard error:"
						+ "\n" + result.stdio.error
					);
					if (false) {
						jsh.shell.console("Standard error: ");
						jsh.shell.console(result.stdio.error);
					}
					return result.stdio.output;
				},
				JSON.parse,
				getInstallationFromDiagnosticOutput
			)

			var getInstallationFromIntention = $api.fp.pipe(
				jsh.shell.jsh.Intention.toShellIntention,
				getInstallationFromShellIntention
			);

			var getDiagnosticScriptForShellAt = $api.fp.pipe(
				jsh.file.Location.from.os,
				jsh.file.Location.directory.relativePath("jrunscript/jsh/test/jsh-data.jsh.js"),
				$api.fp.property("pathname")
			);

			fifty.tests.exports.jsh.Installation.from.current.unbuilt = function() {
				var cast: slime.js.Cast<UnbuiltInstallation> = $api.fp.cast.unsafe;

				var shell = test.shells.unbuilt();

				var intention: slime.jsh.shell.Intention = {
					shell: shell,
					script: getDiagnosticScriptForShellAt(shell.src),
					stdio: {
						output: "string"
					}
				};

				var installation = getInstallationFromIntention(intention);

				verify(installation).evaluate(cast).src.is(shell.src);
			};

			var getJavaHome = function() {
				var h = jsh.shell.java.Jdk.from.javaHome();
				return jsh.file.Pathname(h.base).directory;
			}

			fifty.tests.exports.jsh.Installation.from.current.built = function() {
				var cast: slime.js.Cast<BuiltInstallation> = $api.fp.cast.unsafe;

				var shell = test.shells.built(false);

				var intention: slime.jsh.shell.Intention = {
					shell: shell,
					script: getDiagnosticScriptForShellAt(jsh.shell.jsh.src.pathname.toString()),
					environment: function(current) {
						return $api.Object.compose(
							current,
							{
								JSH_JAVA_HOME: getJavaHome().toString()
							}
						)
					},
					stdio: {
						output: "string"
					}
				};

				var installation = getInstallationFromIntention(intention);

				verify(installation).evaluate(cast).home.is(shell.home);
			};

			fifty.tests.exports.jsh.Installation.from.current.packaged = function() {
				var shell = test.shells.packaged(getDiagnosticScriptForShellAt(test.shells.unbuilt().src));

				var intention: slime.jsh.shell.Intention = {
					package: shell.package,
					stdio: {
						output: "string"
					}
				};

				var installation = getInstallationFromIntention(intention);

				var cast: slime.js.Cast<PackagedInstallation> = $api.fp.cast.unsafe;
				verify(installation).evaluate(cast).package.is(shell.package);
			}

			fifty.tests.exports.jsh.Installation.from.current.remote = function() {
				if (!jsh.httpd.Tomcat) {
					const message = "Cannot test remote shells; Tomcat not present.";
					verify(message).is(message);
					return;
				}
				var remote = test.shells.remote();

				var intention = remote.getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						branch: "local"
					},
					script: "jrunscript/jsh/test/jsh-data.jsh.js"
				});

				var installation = getInstallationFromShellIntention(intention);

				var cast: slime.js.Cast<UrlInstallation> = $api.fp.cast.unsafe;
				verify(installation).evaluate(cast).url.is("http://raw.githubusercontent.com/davidpcaldwell/slime/local/");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface JshShellJsh {
		Intention: {
			toShellIntention: (p: Intention) => slime.jrunscript.shell.run.Intention
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.Intention = fifty.test.Parent();

			fifty.tests.Intention.toShellIntention = fifty.test.Parent();

			fifty.tests.Intention.toShellIntention.unbuilt = function() {
				var intention = jsh.shell.jsh.Intention.toShellIntention({
					shell: {
						src: jsh.shell.jsh.src.toString()
					},
					script: fifty.jsh.file.relative("../../jsh/test/jsh-data.jsh.js").pathname,
					stdio: {
						output: "string"
					}
				});
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					intention
				);
				jsh.shell.console(JSON.stringify(JSON.parse(result.stdio.output), void(0), 4));
			}

			fifty.tests.Intention.toShellIntention.built = function() {
				fifty.run(function shellLaunched() {
					var shellLaunched = jsh.shell.jsh.Intention.toShellIntention({
						shell: {
							home: test.shells.built(false).home
						},
						script: fifty.jsh.file.relative("../../jsh/test/jsh-data.jsh.js").pathname,
						environment: function(was) {
							var PATH = (function() {
								var now = jsh.shell.PATH.pathnames;
								var jdk = jsh.shell.java.Jdk.from.javaHome();
								var bin = jsh.file.Pathname(jdk.base + "/" + "bin");
								now.unshift(bin);
								return jsh.file.Searchpath(now);
							})();
							return $api.Object.compose(
								was,
								{
									PATH: PATH.toString()
								}
							)
						},
						properties: {
							"slime.jrunscript.jsh.shell.jsh.foo": "bar"
						},
						stdio: {
							output: "string"
						}
					});
					var result = $api.fp.world.now.question(
						jsh.shell.subprocess.question,
						shellLaunched
					);
					var output = JSON.parse(result.stdio.output);
					verify(output).evaluate.property("properties").evaluate.property("slime.jrunscript.jsh.shell.jsh.foo").is("bar");
				});

				if (test.shells.built(true)) fifty.run(function nativeLaunched() {
					var shellLaunched = jsh.shell.jsh.Intention.toShellIntention({
						shell: {
							home: test.shells.built(true).home
						},
						script: fifty.jsh.file.relative("../../jsh/test/jsh-data.jsh.js").pathname,
						environment: function(was) {
							//	TODO	maybe we should standardize all this to make it easier to work with native executable
							//			launcher
							var jdk = jsh.shell.java.Jdk.from.javaHome();
							var PATH = (function() {
								var now = jsh.shell.PATH.pathnames;
								var bin = jsh.file.Pathname(jdk.base + "/" + "bin");
								now.unshift(bin);
								return jsh.file.Searchpath(now);
							})();
							return $api.Object.compose(
								was,
								{
									JSH_JAVA_HOME: jdk.base,
									PATH: PATH.toString()
								}
							)
						},
						properties: {
							"slime.jrunscript.jsh.shell.jsh.foo": "bar"
						},
						stdio: {
							output: "string"
						}
					});
					var result = $api.fp.world.now.question(
						jsh.shell.subprocess.question,
						shellLaunched
					);
					var output = JSON.parse(result.stdio.output);
					verify(output).evaluate.property("properties").evaluate.property("slime.jrunscript.jsh.shell.jsh.foo").is("bar");
				})
			}

			fifty.tests.Intention.sensor = function() {
				var unbuilt = test.shells.unbuilt();
				var script = fifty.jsh.file.relative("test/jsh.jsh.js").pathname;
				var pwd = fifty.jsh.file.relative(".");
				var intention: slime.jsh.shell.Intention = $api.Object.compose(
					{
						shell: unbuilt,
						script: script
					},
					{
						arguments: ["--argument", "argValue"],
						/** @type { slime.jsh.shell.Intention["environment"] } */
						environment: function(it) {
							it.Intention_sensor = "whoa";
							return it;
						},
						directory: pwd.pathname,
						properties: {
							"inonit.foo": "inonit.bar"
						}
					},
					{
						stdio: {
							output: "string"
						} as { output: slime.jrunscript.shell.run.OutputCapture }
					}
				);
				var shellIntention = jsh.shell.jsh.Intention.toShellIntention(intention);
				var run = $api.fp.now(jsh.shell.subprocess.question, $api.fp.world.Sensor.mapping());
				var exit = run(shellIntention);
				var output = JSON.parse(exit.stdio.output);
				debugger;
				verify(output).arguments[0].is("--argument");
				verify(output).arguments[1].is("argValue");
				verify(output).environment["Intention_sensor"].evaluate(String).is("whoa");
				verify(output).directory.evaluate(String).is(pwd.pathname);
				jsh.shell.console(JSON.stringify(output.properties));
				verify(output).properties.evaluate.property("inonit").evaluate.property("foo").is("inonit.bar");
			}
		}
	//@ts-ignore
	)(fifty);

	type Argument = string | slime.jrunscript.file.Pathname | slime.jrunscript.file.Node | slime.jrunscript.file.File | slime.jrunscript.file.Directory

	export namespace oo {
		export interface EngineResult {
			status: number

			/**
			 * An additional argument which describes the `jsh` invocation.
			 */
			jsh: {
				/**
				 * The script that was launched.
				 */
				script: Invocation["script"]

				/**
				 * The arguments passed to the script.
				 */
				arguments: Invocation["arguments"]
			}
			environment: Invocation["environment"]
			directory: Invocation["directory"]
			workingDirectory: Invocation["workingDirectory"]

			//	TODO	is this real? Documentation brought from JSAPI.
			// /**
			//  * The classpath supplied to the given script, as specified by the caller.
			//  */
			// classpath: slime.jrunscript.file.Searchpath
		}

		// export interface ForkResult extends EngineResult {
		// 	//	TODO	Plenty of working code indicates this property is present, but so far, analysis of the code has not revealed
		// 	//			why that might be
		// 	//
		// 	//	TODO	Now it looks like only forked shells would have this, which makes sense. Not sure whether it could be
		// 	//			correctly implemented for internal subshells; would have to think hard about java.lang.System streams
		// 	//			etc. and make sure everything was strictly encapsulated.
		// 	stdio: Invocation["stdio"]
		// }
		export type ForkResult = slime.jrunscript.shell.run.old.Result & {
			/**
			 * The operating system command invoked.
			 */
			command: string

			/**
			 * The arguments sent to the operating system command.
			 */
			arguments: string[]
		}

		/**
		 * An object with the same properties as those of the evaluate property of the argument to
		 * {@link slime.jsh.shell.Exports | Exports.shell()}, with differences specified by the {@link ForkResult} and
		 * {@link EngineResult} types.
		 */
		export type Result = ForkResult | EngineResult

		/**
		 * @template R An arbitrary type to return from a `jsh` invocation that is computed using the results of the invocation.
		 */
		export type evaluate<I,R> = (p: I) => R

		/**
		 * An argument with the same semantics as the argument to `shell`, except that it includes some properties in
		 * addition specific to running `jsh` scripts.
		 */
		export interface Invocation<R = Result> {
			/**
			 * The pathname of the script to run.
			 */
			script: slime.jrunscript.file.File

			arguments?: Argument[]

			/**
			 * If `true`, the script is forced to execute in a separate process. Otherwise, jsh may attempt to execute it in-process
			 * if it deems the script to be compatible with its execution environment.
			 */
			fork?: boolean

			//	TODO	is the below comment correct, or does it pertain to the loader?
			/**
			 * The classpath to use when running the `jsh` launcher.
			 */
			classpath?: string

			environment?: any
			stdio?: any
			directory?: any
			workingDirectory?: any
			properties?: { [x: string]: string }

			/**
			 * A function which is called after the script executes, and receives information about the result. It specifies the
			 * return value of the call to `jsh` by returning a value.
			 */
			evaluate?: evaluate<Result,R>

			on?: slime.jrunscript.shell.run.old.Argument["on"]
		}

		export interface EngineInvocation<R = EngineResult> extends Invocation<R> {
			fork?: false
			evaluate?: evaluate<EngineResult,R>
		}

		export interface ForkInvocation<R = ForkResult> extends Invocation<R> {
			/**
			 * A directory representing the location of a built shell, or a directory representing the location of an unbuilt shell.
			 */
			shell?: slime.jrunscript.file.Directory
			fork?: true
			vmarguments?: any

			evaluate?: evaluate<ForkResult,R>
		}
	}

	//	TODO	add tests for packaged shell
	//	TODO	add tests for remote shell
	export interface JshInvoke {
		<R>(p: oo.ForkInvocation<R>): R
		<R>(p: oo.EngineInvocation<R>): R
	}

	export interface JshShellJsh {
		/**
		 * (contingent; only present for built shells) The home directory of the installed shell.
		 */
		home?: slime.jrunscript.file.Directory

		/**
		 * The directory at which the source code for the shell can be found locally, if one exists.
		 */
		src?: slime.jrunscript.file.Directory

		/**
		 * In a remote shell, the URL at which this remote shell is hosted.
		 */
		url: slime.web.Url
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var script = fifty.jsh.file.relative("../test/jsh-data.jsh.js").pathname;

			var environment = $api.Object.compose(
				jsh.shell.environment,
				{
					PATH: (function() {
						var pathnames = jsh.shell.PATH.pathnames;
						pathnames.unshift(
							jsh.file.Pathname(
								jsh.shell.java.Jdk.from.javaHome().base
							).directory.getRelativePath("bin")
						);
						return jsh.file.Searchpath(pathnames).toString();
					})()
				}
			);

			var stdio: { output: "string" } = {
				output: "string"
			};

			var run: (intention: slime.jrunscript.shell.run.Intention) => { string: string } = function(intention) {
				return $api.fp.now(
					$api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					}),
					function(exit) {
						if (exit.status != 0) throw new Error("Exit status: " + exit.status);
						return JSON.parse(exit.stdio.output);
					}
				);
			};

			var getString = function(value: { string: string }) {
				if (!value) return void(0);
				return value.string;
			}

			fifty.tests.exports.jsh.shells = function() {
				var unbuilt = run(test.shells.unbuilt().invoke({
					script: script,
					environment: $api.fp.Mapping.all(environment),
					stdio: stdio
				}));

				var built = run(test.shells.built(false).invoke({
					script: script,
					environment: $api.fp.Mapping.all(environment),
					stdio: stdio
				}));

				var packaged = run(test.shells.packaged(script).invoke({
					environment: $api.fp.Mapping.all(environment),
					stdio: stdio
				}));

				if (jsh.httpd.Tomcat) {
					var remote = run(test.shells.remote().getShellIntention({
						PATH: jsh.shell.PATH,
						settings: {
							branch: "local"
						},
						script: "jrunscript/jsh/test/jsh-data.jsh.js"
					}));
				}

				verify(unbuilt).evaluate.property("jsh.shell.jsh.home").evaluate(getString).is(void(0));
				verify(built).evaluate.property("jsh.shell.jsh.home").evaluate(getString).is(test.shells.built(false).home + "/");
				verify(packaged).evaluate.property("jsh.shell.jsh.home").evaluate(getString).is(void(0));
				if (jsh.httpd.Tomcat) verify(remote).evaluate.property("jsh.shell.jsh.home").evaluate(getString).is(void(0));

				verify(unbuilt).evaluate.property("jsh.shell.jsh.src").evaluate(getString).is(test.shells.unbuilt().src + "/");
				verify(built).evaluate.property("jsh.shell.jsh.src").evaluate(getString).is(void(0));
				verify(packaged).evaluate.property("jsh.shell.jsh.src").evaluate(getString).is(void(0));
				if (jsh.httpd.Tomcat) verify(remote).evaluate.property("jsh.shell.jsh.src").evaluate(getString).is(void(0));

				verify(unbuilt).evaluate.property("jsh.shell.jsh.url").evaluate(getString).is(void(0));
				verify(built).evaluate.property("jsh.shell.jsh.url").evaluate(getString).is(void(0));
				verify(packaged).evaluate.property("jsh.shell.jsh.url").evaluate(getString).is(void(0));
				//	TODO	make sure this is of type URL
				if (jsh.httpd.Tomcat) verify(remote).evaluate.property("jsh.shell.jsh.url").evaluate(getString).is("http://raw.githubusercontent.com/davidpcaldwell/slime/local/");
				if (jsh.httpd.Tomcat) verify(remote).evaluate.property("jsh.shell.jsh.url").evaluate.property("path").is("/davidpcaldwell/slime/local/");
			};
		}
	//@ts-ignore
	)(fifty);

	export interface JshShellJsh {
		lib?: slime.jrunscript.file.Directory
	}

	export interface JshShellJsh {
		/**
		 * Forks this shell, relaunching with the output of the given transform, if any, and exiting with the status of the shell
		 * executed with the transformed parameters. If no argument is given, simply relaunches with the same configuration as was
		 * provided to the launching shell. Otherwise, the transform receives an {@link slime.jsh.shell.Intention} representing the
		 * current shell invocation:
		 * * `package`: set to appropriate value if current invocation is a packaged script
		 * * `shell`, `script`: set to appropriate values if current invocation is not a packaged script
		 * * `arguments`, `directory`: set to values for the current invocation
		 * * `environment`: set to identity function that would simply use this invocation's environment
		 * * `properties`: set to current system properties
		 * * `stdio`: set to `undefined`
		 *
		 * The value returned by the transform will be used to invoke `jsh`, and the exit status of the spawned process will be used
		 * as the exit status of the current process.
		 *
		 */
		relaunch: (p?: slime.$api.fp.Transform<slime.jsh.shell.Intention>) => never
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const subject = fifty.global.jsh.shell;

			fifty.tests.exports.jsh.relaunch = function() {
				var TMPDIR = fifty.jsh.file.temporary.directory();

				verify(subject).environment.evaluate.property("FOO").is(void(0));

				var relauncher = test.shells.unbuilt().invoke({
					script: fifty.jsh.file.relative("test/relaunch.jsh.js").pathname,
					arguments: ["--tmpdir", TMPDIR.pathname],
					stdio: {
						output: "string"
					}
				});

				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: relauncher
				});

				var output = JSON.parse(result.stdio.output);
				verify(output).arguments.length.is(3);
				verify(output).arguments[0].is("1");
				verify(output).arguments[1].is("2");
				verify(output).arguments[2].is("3");
				verify(output).environment.evaluate.property("FOO").is("bar");
				verify(output).directory.evaluate(String).is(TMPDIR.pathname);
				verify(output).properties.evaluate.property("foo.bar").is("baz");
			}
		}
	//@ts-ignore
	)(fifty);

	export interface JshShellJsh {
		require: slime.$api.fp.world.Means<
			{
				satisfied: () => boolean,
				install: () => void
			},
			{
				installing: void
				installed: void
				satisfied: void
			}
		>

		//	TODO	Graal?
		//	TODO	Does Nashorn apply?
		/**
		 * Relaunches the current script in a debugger appropriate to the current engine (Rhino/Nashorn)
		 */
		debug: any
	}

	export interface Exports extends slime.jrunscript.shell.Exports {
		//	TODO	shell?
		rhino: {
			classpath: slime.jrunscript.file.Searchpath
		}

		/**
		 * Identical to {@link slime.jrunscript.shell.Exports | slime.jrunscript.shell.Exports `run()`} except that if the
		 * stdio.output or stdio.error properties are omitted, the output from the subprocess will be sent to the corresponding
		 * stream for the executing shell, rather than discarded.
		 */
		run: slime.jrunscript.shell.Exports["run"] & {
			evaluate: {
				wrap: any
				jsh: {
					wrap: any
				}
			}
		}

		world: slime.jrunscript.shell.Exports["world"] & {
			exit: slime.$api.fp.world.old.Action<number,void>
		}

		HOME: slime.jrunscript.file.Directory
		PATH: slime.jrunscript.file.Searchpath
		listeners: any
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Intention);

				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);
}
