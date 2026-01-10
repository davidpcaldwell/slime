//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/// <reference path="../../../../local/jsh/lib/node/lib/node_modules/@types/js-yaml/index.d.ts" />

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		fifty.tests.manual = {};
	}
//@ts-ignore
)(fifty);

namespace slime.jsh.shell.tools {
	export namespace test {
		export const jsh = (function(fifty: slime.fifty.test.Kit) {
			return function(p: {
				script: string
				arguments?: string[]
				jdks?: {
					local?: string
					user?: string
				}
				lib?: string
				debug?: boolean
			}) {
				const { $api, jsh } = fifty.global;
				const intention: slime.jsh.shell.Intention = {
					shell: {
						src: jsh.shell.jsh.src.toString()
					},
					script: p.script,
					arguments: p.arguments,
					environment: function(existing) {
						var rv: { [x: string]: string } = $api.Object.compose(existing);
						if (p.jdks?.local) rv.JSH_LOCAL_JDKS = p.jdks.local;
						if (p.jdks?.user) rv.JSH_USER_JDKS = p.jdks.user;
						//	TODO	would not work on Windows
						if (p.jdks && !p.jdks.user) rv.JSH_USER_JDKS = "/dev/null";
						if (p.lib) rv.JSH_SHELL_LIB = p.lib;
						if (p.debug) rv.JSH_LAUNCHER_COMMAND_DEBUG = "1";
						return rv;
					}
				}
				return jsh.shell.jsh.Intention.toShellIntention(intention);
			}
		//@ts-ignore
		})(fifty);
	}
}

namespace slime.jsh.shell.tools {
	export namespace rhino {
		export interface Installation {
			pathname: string
			version: slime.$api.fp.impure.External<slime.$api.fp.Maybe<string>>
		}

		export interface OldInstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }

			/**
			 * A local copy of the Rhino JAR file to install.
			 */
			local?: slime.jrunscript.file.File

			/**
			 * A named version of Rhino to download and install; ignored if `local` is specified. Available versions include:
			 *
			 * * mozilla/1.8.0 (the default)
			 * * mozilla/1.7.15 (the default for JDK 8)
			 * * mozilla/1.7.14 (unsupported)
			 * * mozilla/1.7.13 (unsupported)
			 */
			version?: string

			/**
			 * Whether to replace the existing installation in the shell if one is found (`true`), or to leave it in place (`false`,
			 * the default).
			 */
			replace?: boolean
		}

		export interface RequireCommand {
			/**
			 * A named version of Rhino to download and install if an acceptable version is not present.
			 *
			 * * mozilla/1.7.15 (the default, and only tested/supported version)
			 * * mozilla/1.7.14
			 * * mozilla/1.7.13
			 */
			version?: string

			/**
			 * Used to decide whether to replace the existing installation if one is found. If Rhino is already present at the
			 * installation location, this function will be invoked with the version of Rhino that is currently installed.
			 *
			 * If this function is not omitted, the default is not to replace the existing version.
			 *
			 * @param version The version of Rhino found
			 * @returns `true` to replace the installation; `false` to leave it in place.
			 */
			replace?: (version: string) => boolean
		}

		export interface OldInstallEvents {
			console: string

			installed: {
				to: slime.jrunscript.file.Pathname
			}
		}

		export interface InstallEvents {
			console: string
			installed: string
		}

		export interface RequireEvents extends InstallEvents {
			satisfied: string
			installing: string
		}
	}

	export interface Exports {
		/**
		 * Operations pertaining to this shell's installation of Mozilla Rhino.
		 */
		rhino: {
			/**
			 * Returns the installation of Rhino for the current shell, if one exists.
			 */
			installation: {
				simple: slime.$api.fp.impure.External<slime.$api.fp.Maybe<rhino.Installation>>
			}

			install: {
				/**
				 * @deprecated Use {@link Exports | rhino.require }.
				 *
				 * Installs Rhino as a JavaScript engine for the currently executing shell.
				 */
				old: (
					argument?: slime.jsh.shell.tools.rhino.OldInstallCommand,
					receiver?: slime.$api.event.Function.Receiver<slime.jsh.shell.tools.rhino.OldInstallEvents>
				) => void
			}

			//	TODO #1621	No test coverage at all for rhino.require()
			require: {
				world: (lib?: string) => slime.$api.fp.world.Means<rhino.RequireCommand,rhino.RequireEvents>

				action: slime.$api.fp.world.Action<rhino.RequireEvents>

				simple: slime.$api.fp.impure.Process
			}
		}
	}

	export namespace rhino {
		(
			function(
				Packages: slime.jrunscript.Packages,
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;

				fifty.tests.rhino = fifty.test.Parent();

				fifty.tests.rhino.old = function() {
					const dependencies = (
						function() {
							const script: slime.project.dependencies.Script = fifty.$loader.script("../../../../contributor/dependencies/module.js");
							return script({
								java: {
									version: String(Packages.java.lang.System.getProperty("java.version"))
								},
								library: {
									file: jsh.file
								}
							})
						}
					)();

					var Captor = function() {
						var events: slime.$api.Event<any>[] = [];

						return {
							console: function(e) {
								events.push(e);
							},
							installed: function(e) {
								events.push(e);
							},
							captured: Object.assign(
								events,
								{
									type: function(type) {
										return events.filter(function(e) { return e.type == type; });
									}
								}
							)
						}
					}

					var lib = jsh.shell.TMPDIR.createTemporary({ directory: true });

					var mock = {
						lib: lib,
						rhino: void(0)
					};

					var toConsoleEvent = function(e: slime.$api.Event<string>): slime.$api.Event<string> {
						return e;
					};

					var readFile = function(p: slime.jrunscript.file.File) {
						return p.read(String);
					};

					fifty.run(function alreadyInstalled() {
						lib.getRelativePath("js.jar").write("already", { append: false });
						var captor = Captor();
						jsh.shell.tools.rhino.install.old({ mock: mock }, captor);
						verify(captor).captured[0].type.is("console");
						verify(captor).captured[0].evaluate(toConsoleEvent).detail.is("Rhino already installed at " + lib.getFile("js.jar"));
						verify(lib).getFile("js.jar").evaluate(readFile).is("already");
						verify(captor.captured.type("installed")).length.is(0);
						lib.getFile("js.jar").remove();
					});

					fifty.run(function replace() {
						lib.getRelativePath("js.jar").write("original", { append: false });
						lib.getRelativePath("download").write("downloaded", { append: false });
						mock.rhino = lib.getFile("download");
						var captor = Captor();
						verify(lib).getFile("js.jar").evaluate(readFile).is("original");
						jsh.shell.tools.rhino.install.old({ mock: mock, replace: true }, captor);
						verify(captor).captured[0].type.is("console");
						verify(captor).captured[0].evaluate(toConsoleEvent).detail.is("Replacing Rhino at " + lib.getRelativePath("js.jar") + " ...");
						verify(captor).captured[1].type.is("console");
						verify(captor).captured[1].evaluate(toConsoleEvent).detail.is("Installing Rhino version " + dependencies.data.rhino.version().id + " to " + lib.getRelativePath("js.jar") + " ...");
						//verify(lib).getFile("js.jar").evaluate(readFile).is.not("original");
						verify(captor.captured.type("installed")).length.is(1);
						lib.getFile("js.jar").remove();
					});

					fifty.run(function install() {
						var captor = Captor();
						jsh.shell.tools.rhino.install.old({ mock: mock }, captor);
						verify(captor).captured[0].type.is("console");
						verify(captor).captured[0].evaluate(toConsoleEvent).detail.is("No Rhino at " + lib.getRelativePath("js.jar") + "; installing ...");
						verify(captor).captured[1].type.is("console");
						verify(captor).captured[1].evaluate(toConsoleEvent).detail.is("Installing Rhino version " + dependencies.data.rhino.version().id + " to " + lib.getRelativePath("js.jar") + " ...");
						verify(lib).getFile("js.jar").is.not(null);
						verify(captor.captured.type("installed")).length.is(1);
						lib.getFile("js.jar").remove();
					});
				};

				fifty.tests.manual.rhino = {};

				fifty.tests.manual.rhino.install = function() {
					var jdk = jsh.internal.bootstrap.java.getMajorVersion();
					jsh.shell.console("jdk = " + jdk);
					var version = jsh.internal.bootstrap.rhino.forJava(jdk);
					jsh.shell.console("rhino = " + version.version);
				}

				fifty.tests.manual.rhino.show = function() {
					var rhino = jsh.shell.tools.rhino.installation.simple();
					if (rhino.present) {
						var version = rhino.value.version();
						var manifest = jsh.java.tools.jar.manifest.simple({ pathname: rhino.value.pathname });
						jsh.shell.console("manifest = " + JSON.stringify(manifest));
						jsh.shell.console( (version.present) ? "Installed: " + version.value : "Installed: version Unknown" );
					} else {
						jsh.shell.console( "Not installed." );
					}
				}
			}
		//@ts-ignore
		)(Packages,fifty);
	}
}

namespace slime.external.rename {
	export type _jsyaml = typeof jsyaml;
}

namespace slime.external {
	/**
	 * The `js-yaml` v3 API; see the [README](https://github.com/nodeca/js-yaml/blob/master/README.md).
	 */
	export type jsyaml = slime.external.rename._jsyaml;
}

(
	function(
		fifty: slime.fifty.test.Kit
	) {
		const { verify } = fifty;
		const { $api, jsh } = fifty.global;

		fifty.tests.jsyaml = function() {
			jsh.shell.tools.jsyaml.require();
			var jsyaml = jsh.shell.tools.jsyaml.load();
			if (typeof(jsyaml) == "undefined") throw new Error("No jsyaml.");
			var parsed = jsyaml.load(
				$api.fp.now(
					fifty.jsh.file.relative("../../../../docker-compose.yaml"),
					jsh.file.Location.file.read.string.simple
				)
			);
			verify(parsed).evaluate.property("name").is("slime");
		}
	}
//@ts-ignore
)(fifty);

namespace slime.jsh.shell.tools {
	export interface Exports {
		ncdbg: any
	}

	export namespace mkcert {
		export interface Installation {
			/**
			 * The location of the `mkcert` executable in this installation.
			 */
			program: slime.jrunscript.file.File

			/**
			 * Whether the root CA exists and is trusted by the system.
			 */
			isTrusted: () => boolean

			/**
			 * Creates a PKCS12 certificate pertaining to the given hosts at the given location.
			 */
			pkcs12: (p: {
				/**
				 * The list of hosts to which this certificate should pertain.
				 */
				hosts: string[]

				/**
				 * The destination path to which to generate the certificate. If omitted, `mkcert` itself will generate a path
				 * and report it to the console. If you're writing an application that's intending to use the certificate, this
				 * is probably not what you want.
				 */
				to?: slime.jrunscript.file.Pathname
			}) => void
		}
	}

	export interface Exports {
		mkcert: {
			install: (p?: { destination?: slime.jrunscript.file.Pathname, replace?: boolean }) => mkcert.Installation
			require: () => mkcert.Installation

			tomcatConfiguration: (p: {
				/**
				 * A set of hosts to which to support https requests.
				 */
				hosts: string[]
			}) => slime.jsh.httpd.tomcat.Configuration["https"]
		}
	}

	export interface Exports {
		/**
		 * Integration with [`js-yaml`](https://github.com/nodeca/js-yaml) v3, which provides support for the YAML serialization
		 * format.
		 */
		jsyaml: {
			/**
			 * Downloads `js-yaml`, installs it into the current shell, and returns it. Property is available if this shell allows
			 * the installation of libraries.
			 */
			install?: () => slime.external.jsyaml

			/**
			 * Returns `js-yaml`, downloading it if it is not installed in the shell. If it is not installed in the shell and *can*
			 * be installed into the shell, it will be installed into the shell.
			 */
			require: () => slime.external.jsyaml

			/**
			 * Loads `js-yaml`, downloading its code if it is not installed into the shell, and returns it.
			 */
			load: () => slime.external.jsyaml
		}
	}

	export interface Exports {
		selenium: {
			/**
			 * Loads the Selenium Java API if it is present; otherwise, throws an exception. If the Chrome Selenium driver is
			 * installed into the shell, the API will be configured to use it.
			 */
			load: () => void
		}
	}

	export interface Exports {
		kotlin: {
			install: slime.$api.fp.world.Means<{ replace?: boolean }, { console: string }>
		}
	}

	export namespace scala {
		export interface Exports {
			Installation: {
				from: {
					jsh: slime.$api.fp.impure.Input<slime.jrunscript.tools.scala.Installation>
				}

				//	TODO	should be able to migrate this to jrunscript at some point, but currently uses a jsh-specific API for
				//			implementation
				install: (installation: slime.jrunscript.tools.scala.Installation) => slime.$api.fp.world.Means<{ majorVersion: number }, void>
			} & slime.jrunscript.tools.scala.Exports["Installation"]
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const subject = jsh.shell.tools.scala;

				fifty.tests.scala = fifty.test.Parent();

				fifty.tests.scala.three = function() {
					const lib = fifty.jsh.file.temporary.directory();

					var getVersionScript = test.jsh({
						script: fifty.jsh.file.relative("test/scala-version.jsh.js").pathname,
						lib: lib.pathname,
						debug: false
					});

					var install = test.jsh({
						script: fifty.jsh.file.relative("scala.jsh.js").pathname,
						arguments: ["--version", "3"],
						lib: lib.pathname
					});

					var execute = function(intention: slime.jrunscript.shell.run.Intention) {
						return $api.fp.world.now.question(
							jsh.shell.subprocess.question,
							$api.Object.compose(intention, {
								stdio: {
									output: "string"
								}
							})
						);
					};

					var outputToVersion = function(exit: slime.jrunscript.shell.run.Exit): slime.$api.fp.Maybe<any> {
						if (exit.status != 0) throw new Error("Exit status: " + exit.status);
						return JSON.parse(exit.stdio.output);
					};

					var getVersion = function() {
						return $api.fp.now.invoke(
							getVersionScript,
							execute,
							outputToVersion
						)
					};

					var getMajorVersion = function getMajorVersion(version) {
						return Number(version.split(".")[0]);
					}

					var before = getVersion();
					execute(install);
					var after = getVersion();

					verify(before).present.is(false);
					verify(after).present.is(true);
					if (after.present) {
						verify(after).value.evaluate(getMajorVersion).is(3);
					}
				}

				fifty.tests.manual.scala = {};

				fifty.tests.manual.scala.getVersion = function() {
					var managed = subject.Installation.from.jsh();
					var version = $api.fp.world.now.question(
						subject.Installation.getVersion,
						managed
					);
					jsh.shell.console(JSON.stringify(version));
				}

				fifty.tests.manual.scala.compile = function() {
					var local = subject.Installation.from.jsh();
					var to = fifty.jsh.file.temporary.location();
					var compile = subject.Installation.compile(local);
					var run = subject.Installation.run(local);
					$api.fp.world.now.action(
						compile,
						{
							deprecation: true,
							destination: jsh.file.Pathname(to.pathname),
							files: [fifty.jsh.file.object.getRelativePath("test/data/Hello.scala")]
						}
					);
					$api.fp.world.now.action(
						run,
						{
							deprecation: true,
							classpath: jsh.file.Pathname(to.pathname),
							main: "Hello"
						}
					);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		scala: scala.Exports
	}

	export interface Exports {
		jsoup: any
	}

	export interface Exports {
		javamail: {
			install: () => void
			require: () => void
		}
	}

	export interface Exports {
		postgresql: any
	}
}

namespace slime.jsh.shell.tools {
	export namespace node {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.node = fifty.test.Parent();
			}
		//@ts-ignore
		)(fifty);

		export interface RequireEvents {
			installed: slime.jrunscript.tools.node.Installation
			removed: {
				version: string
			}
			found: slime.jrunscript.tools.node.Installation
		}

		export interface Managed {
			/**
			 * The local installation of Node.js in the `jsh` shell. May or may not be actually present.
			 */
			installation: slime.jrunscript.tools.node.Installation

			installed: slime.jrunscript.tools.node.object.Installation

			/**
			 * Require that a managed Node.js be present. The version will be determined by examining the default version from the
			 * {@link slime.jrunscript.tools.node.Exports | module versions.default} property and possibly revising it based on
			 * detected local configuration (for example, the operating system and version).
			 */
			require: {
				/**
				 * Events:
				 * * {@link slime.jrunscript.tools.node.object.install.Events}: standard installation events
				 * * `removed`: fired if an incorrect version of Node.js is found and must be removed. Specifies the location from
				 * which it is removed and the version that is being removed.
				 * * `found`: fired if the correct version of Node.js is found and nothing is done.
				 */
				action: slime.$api.fp.world.Action<
					RequireEvents
				>

				simple: slime.$api.fp.impure.Process
			}
		}

		export interface Exports extends slime.jrunscript.tools.node.Exports, slime.jsh.shell.tools.node.Managed {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				var getVersion = function(install: slime.jrunscript.tools.node.Installation) {
					return $api.fp.world.Sensor.now({
						sensor: jsh.shell.tools.node.Installation.getVersion,
						subject: install
					});
				}

				$api.fp.world.Action.now({
					action: jsh.shell.tools.node.require.action,
					handlers: {
						found: function(e) {
							jsh.shell.console("Found Node.js: " + getVersion(e.detail));
						},
						installed: function(e) {
							jsh.shell.console("Installed node: " + getVersion(e.detail));
						}
					}
				});

				const api = jsh.shell.tools.node.installed;

				fifty.tests.node.jsapi = fifty.test.Parent();

				fifty.tests.node.jsapi.a = function() {
					var result = api.run({
						arguments: [fifty.jsh.file.object.getRelativePath("../../../../rhino/tools/node/test/hello.js")],
						stdio: {
							output: String
						}
					});
					verify(result).stdio.output.is("Hello, World (Node.js)\n");
				}

				fifty.tests.node.jsapi.b = function() {
					//	TODO	should not be messing with global installation in tests
					if (api.modules["minimal-package"]) {
						api.run({
							command: "npm",
							arguments: ["uninstall", "-g", "minimal-package"]
						});
						api.modules["refresh"]();
					}
					verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
					var result = api.run({
						command: "npm",
						arguments: ["install", "-g", "minimal-package"]
					});
					api.modules["refresh"]();
					verify(api).modules.installed["minimal-package"].is.type("object");

					api.run({
						command: "npm",
						arguments: ["uninstall", "-g", "minimal-package"]
					});
					api.modules["refresh"]();
					verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
				}

				fifty.tests.node.jsapi.c = function() {
					if (api.modules["minimal-package"]) {
						api.modules.uninstall({
							name: "minimal-package"
						});
					}
					verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
					api.modules.install({
						name: "minimal-package"
					});
					verify(api).modules.installed["minimal-package"].is.type("object");

					api.modules.uninstall({
						name: "minimal-package"
					});
					verify(api).modules.installed.evaluate.property("minimal-package").is(void(0));
				}

				fifty.tests.manual.node = {};
				fifty.tests.manual.node.jsh = {};
				fifty.tests.manual.node.jsh.modules = function() {
					var installation = jsh.shell.tools.node.installation;
					var modules = $api.fp.world.Question.now({
						question: jsh.shell.tools.node.Installation.modules(installation).list(),
					});
					modules.forEach(function(module) {
						jsh.shell.console(module.name + " " + module.version);
					});
				}
				fifty.tests.manual.node.jsh.require = function() {
					//	remove existing
					var existing = fifty.jsh.file.relative("../../../../local/jsh/lib/node");
					jsh.shell.console("Checking " + existing.pathname);
					if (jsh.file.Location.directory.exists.simple(existing)) {
						jsh.shell.console("Removing " + existing.pathname);
						jsh.file.Location.directory.remove.simple(existing);
					}
					jsh.shell.tools.node.require.simple();
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		/**
		 * Provides convenience methods to represent and use Node.js installations.
		 */
		node: node.Exports
	}
}

namespace slime.jsh {
	//	TODO	the need to modify slime.jsh in this plugin, as well as jsh.shell.tools, probably means a refactor is needed
	export interface Tools {
		gradle: any
	}
}

namespace slime.jsh.shell {
	export interface Exports {
		/**
		 * APIs pertaining to tools that can be installed into the `jsh` shell, like Mozilla Rhino, Apache Tomcat, Node.js,
		 * Kotlin and Scala, and other development tools.
		 */
		tools: slime.jsh.shell.tools.Exports
	}
}

namespace slime.jsh.shell.tools {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			var slime: slime.$api.fp.impure.Input<slime.jrunscript.file.world.Location> = $api.fp.returning(fifty.jsh.file.relative("../../.."));

			fifty.tests.manual.initial = function() {
				//	TODO	more modular version of invocation is in tomcat.fifty.ts currently
				jsh.shell.console("slime = " + slime().pathname);
				var jdks = fifty.jsh.file.temporary.directory();
				var lib = fifty.jsh.file.temporary.directory();
				var invocation = jsh.shell.Invocation.from.argument({
					command: "bash",
					arguments: $api.Array.build(function(rv) {
						rv.push($api.fp.now.invoke(slime(), jsh.file.world.Location.relative("jsh.bash")).pathname);
						rv.push($api.fp.now.invoke(slime(), jsh.file.world.Location.relative("jsh/test/jsh-data.jsh.js")).pathname);
					}),
					environment: $api.Object.compose(
						jsh.shell.environment,
						{
							JSH_LOCAL_JDKS: jdks.pathname,
							JSH_USER_JDKS: "/dev/null",
							JSH_SHELL_LIB: lib.pathname
						}
					),
					stdio: {
						output: "line",
						error: "line"
					}
				});
				$api.fp.world.now.action(
					jsh.shell.world.action,
					invocation,
					{
						stdout: function(e) {
							jsh.shell.console("STDOUT: " + e.detail.line);
						},
						stderr: function(e) {
							jsh.shell.console("STDERR: " + e.detail.line);
						}
					}
				);
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			//	TODO	this test appears clearly misplaced; is there now a jrunscript/io in which to put this?
			fifty.tests.poi = function() {
				var poi = jsh.shell.jsh.lib.getSubdirectory("poi");
				if (poi) {
					verify(jsh).io.grid.excel.is.type("object");
				} else {
					verify(jsh).io.grid.evaluate.property("excel").is(void(0));
				}
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const script: internal.tomcat.Script = fifty.$loader.script("tomcat.js");

			const subject = script({
				library: {
					file: fifty.global.jsh.file,
					http: fifty.global.jsh.http,
					install: fifty.global.jsh.tools.install,
					shell: fifty.global.jsh.shell
				},
				console: fifty.global.jsh.shell.console,
				jsh: fifty.global.jsh
			});

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.rhino);
				fifty.load("tomcat.fifty.ts");
				fifty.run(fifty.tests.jsyaml);
				fifty.run(fifty.tests.scala);
				fifty.run(fifty.tests.node);
				fifty.run(fifty.tests.poi);
			}
		}
	//@ts-ignore
	)(fifty);
}
