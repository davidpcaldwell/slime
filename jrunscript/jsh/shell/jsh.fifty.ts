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
			}

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

	export interface Exports extends slime.jrunscript.shell.Exports {
		/**
		 * @deprecated Replaced by `run`.
		 *
		 * Executes a subprocess.
		 */
		shell: {
			(p: any): any
			(a: any, b: any, c: any): any
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
		jsh: JshShellJsh
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
			properties?: { [name: string]: string }
		}
		& Pick<slime.jrunscript.shell.run.Intention,"stdio">
	)

	export namespace jsh {
		export interface Exit {
			status: number
			stdio?: {
				output?: string
				error?: string
			}
		}
	}

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
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const fixtures = (function() {
				var script: slime.jsh.test.Script = fifty.$loader.script("../fixtures.ts");
				return script();
			})();

			fifty.tests.exports.jsh.Installation = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from = fifty.test.Parent();

			fifty.tests.exports.jsh.Installation.from.current = fifty.test.Parent();

			var getInstallationFromDiagnosticOutput: (data: any) => slime.jsh.shell.Installation = $api.fp.property("installation");

			var getInstallationFromShellIntention = $api.fp.pipe(
				$api.fp.world.Sensor.mapping({ sensor: jsh.shell.subprocess.question }),
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

				var shell = fixtures.shells(fifty).unbuilt();

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

				var shell = fixtures.shells(fifty).built();

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
				var shell = fixtures.shells(fifty).packaged(getDiagnosticScriptForShellAt(fixtures.shells(fifty).unbuilt().src));

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
				var remote = fixtures.shells(fifty).remote();

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

			sensor: slime.$api.fp.world.Sensor<
				Intention,
				{ stdout: slime.jrunscript.shell.run.Line, stderr: slime.jrunscript.shell.run.Line },
				jsh.Exit
			>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.Intention = fifty.test.Parent();

			fifty.tests.Intention.toShellIntention = function() {
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
				var exit = $api.fp.world.Sensor.now({
					sensor: jsh.shell.jsh.Intention.sensor,
					subject: intention
				});
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
			jsh: {
				script: Invocation["script"]
				arguments: Invocation["arguments"]
			}
			environment: Invocation["environment"]
			directory: Invocation["directory"]
			workingDirectory: Invocation["workingDirectory"]
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
		export type ForkResult = slime.jrunscript.shell.run.old.Result

		export type Result = ForkResult | EngineResult

		export interface Invocation {
			script: slime.jrunscript.file.File
			arguments?: Argument[]
			environment?: any
			stdio?: any
			directory?: any
			workingDirectory?: any
			properties?: { [x: string]: string }

			on?: slime.jrunscript.shell.run.old.Argument["on"]
		}

		export interface EngineInvocation<R = EngineResult> extends Invocation {
			fork?: false
			evaluate?: (p: EngineResult) => R
		}

		export interface ForkInvocation<R = ForkResult> extends Invocation {
			shell?: slime.jrunscript.file.Directory
			fork?: true
			vmarguments?: any

			evaluate?: (p: ForkResult) => R
		}
	}

	export interface JshInvoke {
		<R>(p: oo.ForkInvocation<R>): R
		<R>(p: oo.EngineInvocation<R>): R
	}

	export interface JshShellJsh extends JshInvoke {
		src?: slime.jrunscript.file.Directory

		lib?: slime.jrunscript.file.Directory
		home?: slime.jrunscript.file.Directory

		relaunch: (p?: {
			environment?: (initial: slime.jrunscript.shell.Exports["environment"]) => slime.jrunscript.shell.Exports["environment"]
		}) => void

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

		debug: any
		url: any
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
