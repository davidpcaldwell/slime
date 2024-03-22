//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/// <reference path="../../../../local/jsh/lib/node/lib/node_modules/@types/js-yaml/index.d.ts" />

namespace slime.external.rename {
	export type _jsyaml = typeof jsyaml;
}

namespace slime.external {
	/**
	 * The `js-yaml` v3 API; see the [README](https://github.com/nodeca/js-yaml/blob/v3/README.md).
	 */
	export type jsyaml = slime.external.rename._jsyaml;
}

namespace slime.jsh.shell.tools {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

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
						return rv;
					}
				}
				return jsh.shell.jsh.Intention.toShellIntention(intention);
			}
		//@ts-ignore
		})(fifty);
	}

	export namespace rhino {
		export interface InstallCommand {
			mock?: { lib: slime.jrunscript.file.Directory, rhino: slime.jrunscript.file.File }

			/**
			 * A local copy of the Rhino JAR file to install.
			 */
			local?: slime.jrunscript.file.File

			/**
			 * A named version of Rhino to download and install; ignored if `local` is specified. Available versions include:
			 *
			 * * mozilla/1.7.14 (the default)
			 * * mozilla/1.7R3
			 * * mozilla/1.7.12
			 * * mozilla/1.7.13
			 */
			version?: string

			/**
			 * Whether to replace the existing installation if one is found (`true`), or to leave it in place (`false`, the
			 * default).
			 */
			replace?: boolean
		}
	}

	export interface Exports {
		rhino: {
			install: (
				p?: rhino.InstallCommand,
				events?: any
			) => void

			require: slime.$api.fp.world.Means<rhino.InstallCommand,{
				satisfied: string
				installing: string
				installed: string
			}>
		}
	}

	export namespace rhino {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { jsh } = fifty.global;

				fifty.tests.rhino = function() {
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
						jsh.shell.tools.rhino.install({ mock: mock }, captor);
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
						jsh.shell.tools.rhino.install({ mock: mock, replace: true }, captor);
						verify(captor).captured[0].type.is("console");
						verify(captor).captured[0].evaluate(toConsoleEvent).detail.is("Replacing Rhino at " + lib.getRelativePath("js.jar") + " ...");
						verify(captor).captured[1].type.is("console");
						verify(captor).captured[1].evaluate(toConsoleEvent).detail.is("Installing Rhino to " + lib.getRelativePath("js.jar") + " ...");
						verify(lib).getFile("js.jar").evaluate(readFile).is("downloaded");
						verify(captor.captured.type("installed")).length.is(1);
						lib.getFile("js.jar").remove();
					});

					fifty.run(function install() {
						lib.getRelativePath("download").write("downloaded", { append: false });
						mock.rhino = lib.getFile("download");
						var captor = Captor();
						jsh.shell.tools.rhino.install({ mock: mock }, captor);
						verify(captor).captured[0].type.is("console");
						verify(captor).captured[0].evaluate(toConsoleEvent).detail.is("No Rhino at " + lib.getRelativePath("js.jar") + "; installing ...");
						verify(captor).captured[1].type.is("console");
						verify(captor).captured[1].evaluate(toConsoleEvent).detail.is("Installing Rhino to " + lib.getRelativePath("js.jar") + " ...");
						verify(lib).getFile("js.jar").evaluate(readFile).is("downloaded");
						verify(captor.captured.type("installed")).length.is(1);
						lib.getFile("js.jar").remove();
					});
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		ncdbg: any
	}

	export interface Exports {
		graal: any
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
		kotlin: any
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
						lib: lib.pathname
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

		export interface Managed {
			/**
			 * The local installation of Node.js in the `jsh` shell. May or may not be actually present.
			 */
			installation: slime.jrunscript.tools.node.Installation

			installed: slime.jrunscript.tools.node.object.Installation

			require: slime.$api.fp.world.Means<void,slime.jrunscript.tools.node.object.install.Events & {
				removed: {
					at: string
					version: string
				}
				found: slime.jrunscript.tools.node.object.Installation
			}>
		}

		export interface Exports extends slime.jrunscript.tools.node.Exports, slime.jsh.shell.tools.node.Managed {
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				$api.fp.impure.now.process(
					$api.fp.world.output(jsh.shell.tools.node.require)
				)

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
				fifty.tests.manual.node.jsh = function() {
					var installation = jsh.shell.tools.node.installation;
					var modules = $api.fp.world.now.question(
						jsh.shell.tools.node.Installation.modules.list(),
						installation
					);
					modules.forEach(function(module) {
						jsh.shell.console(module.name + " " + module.version);
					});
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
		tools: jsh.shell.tools.Exports
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
			const script: internal.tomcat.Script = fifty.$loader.script("tomcat.js");

			const subject = script({
				$api: fifty.global.$api,
				jsh: fifty.global.jsh
			});

			fifty.tests.suite = function() {
				fifty.load("tomcat.fifty.ts");

				fifty.run(fifty.tests.rhino);
				fifty.run(fifty.tests.node);
				fifty.run(fifty.tests.scala);
			}
		}
	//@ts-ignore
	)(fifty);
}
