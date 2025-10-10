//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.test {
	export namespace fixtures {
		export const shells = (function(fifty: slime.fifty.test.Kit) {
			const script: slime.jsh.test.Script = fifty.$loader.script("fixtures.ts");
			return script().shells(fifty);
		//@ts-ignore
		})(fifty);

		export const clone = (function(fifty: slime.fifty.test.Kit) {
			const script: slime.jsh.wf.test.Script = fifty.$loader.script("../../tools/wf/test/fixtures.ts");
			return script()(fifty).clone;
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const { shells } = fixtures;

			var run: (intention: slime.jrunscript.shell.run.Intention) => any = function(intention) {
				return $api.fp.now(
					$api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					}),
					function(exit) {
						if (exit.status != 0) {
							jsh.shell.console("STANDARD OUTPUT");
							jsh.shell.console(exit.stdio.output);
							jsh.shell.console("STANDARD ERROR");
							jsh.shell.console(exit.stdio.error);
							throw new Error("Exit status: " + exit.status + " for intention " + JSON.stringify(intention));
						}
						return JSON.parse(exit.stdio.output);
					}
				);
			};

			fifty.tests.remote = fifty.test.Parent();

			fifty.tests.remote.localScript = function() {
				var intention = shells.remote().getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						branch: "local"
					},
					script: "jrunscript/jsh/test/jsh-data.jsh.js"
				});
				var remoteShellLocalScript = run(intention);
				jsh.shell.console(JSON.stringify(remoteShellLocalScript,void(0),4));
				verify(remoteShellLocalScript).evaluate.property("jsh.script.file").is.type("object");
				verify(remoteShellLocalScript).evaluate.property("jsh.script.url").is.type("undefined");
			};

			fifty.tests.remote.remoteScript = function() {
				var remoteShellRemoteScript = run(shells.remote().getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						branch: "local"
					},
					script: shells.remote().getSlimeUrl({ path: "jrunscript/jsh/test/jsh-data.jsh.js" })
				}));
				jsh.shell.console(JSON.stringify(remoteShellRemoteScript,void(0),4));
				verify(remoteShellRemoteScript).evaluate.property("jsh.script.file").is.type("undefined");
				verify(remoteShellRemoteScript).evaluate.property("jsh.script.url").is.type("object");
			};

			fifty.tests.executable = function() {
				var ISSUE_2039_RESOLVED = false;
				var shell = fixtures.shells.built(true);
				if (ISSUE_2039_RESOLVED && shell) {
					var home = jsh.file.Pathname(shell.home).directory;
					var jdk = jsh.shell.java.Jdk.from.javaHome();
					var jdkBin = $api.fp.now(jdk.base, jsh.file.Location.from.os, jsh.file.Location.directory.relativePath("bin"));

					var addJavaToPath = function(existing) {
						var pathnames: slime.jrunscript.file.Pathname[] = [];
						pathnames.push(jsh.file.Pathname(jdkBin.pathname));
						pathnames = pathnames.concat(existing.pathnames);
						return jsh.file.Searchpath(pathnames);
					};

					var PATH = addJavaToPath(jsh.shell.PATH);

					var evaluate = function(name) {
						return function(result) {
							if (result.status != 0) {
								throw new Error("Status: " + result.status + " output=[" + result.stdio.output + "]");
							}
							if (!result.stdio.output) {
								jsh.shell.console("built = " + shell.home);
								throw new Error(name + " status 0 but empty string emitted");
							} else {
								return JSON.parse(result.stdio.output);
							}
						}
					};

					var environment = $api.Object.compose(jsh.shell.environment, {
						JSH_JAVA_HOME: jdk.base,
						PATH: PATH.toString()
					});
					jsh.shell.console("environment = " + JSON.stringify(environment));
					var output = jsh.shell.run({
						command: home.getFile("jsh"),
						arguments: [home.getFile("src/jrunscript/jsh/test/jsh-data.jsh.js")],
						environment: environment,
						stdio: {
							output: String
						},
						evaluate: evaluate("built file")
					});
					verify(output)["jsh.shell.jsh.home"].string.evaluate(String).is(home.toString());

					(function absolute() {
						var output = jsh.shell.run({
							command: home.getFile("jsh").toString(),
							arguments: [home.getFile("src/jrunscript/jsh/test/jsh-data.jsh.js")],
							environment: environment,
							stdio: {
								output: String
							},
							evaluate: evaluate("built string")
						});
						verify(output)["jsh.shell.jsh.home"].string.evaluate(String).is(home.toString());
					})();

					var shellCommand = function(p) {
						var lines = [];
						if (p.directory) {
							lines.push("cd " + p.directory);
						}
						if (p.PATH) {
							lines.push("export PATH=\"" + p.PATH + "\"");
							lines.push("export -n JAVA_HOME");
						}
						lines.push(p.command + " " + p.arguments.join(" "));
						var file = jsh.shell.TMPDIR.createTemporary({ suffix: ".bash" });
						file.pathname.write(lines.join("\n"), { append: false });
						jsh.shell.console(file + "\n" + file.read(String) + "\n\n");
						return jsh.shell.run({
							command: "bash",
							arguments: [file].concat(p.arguments),
							directory: file.parent,
							stdio: {
								output: String
							},
							evaluate: p.evaluate
						});
					};

					(function relative() {
						var basedir = home.pathname.basename;
						var parent = home.parent;

						var output = shellCommand({
							command: basedir + "/" + "jsh",
							arguments: [home.getFile("src/jrunscript/jsh/test/jsh-data.jsh.js")],
							directory: parent,
							stdio: {
								output: String
							},
							PATH: addJavaToPath(jsh.shell.PATH),
							evaluate: evaluate("relative")
						});
						verify(output)["jsh.shell.jsh.home"].string.is(home.toString());
					})();

					(function inPath() {
						var directory = home;
						var PATH = addJavaToPath(jsh.file.Searchpath([directory.pathname].concat(jsh.shell.PATH.pathnames)));
						var output = shellCommand({
							command: "jsh",
							PATH: PATH,
							arguments: [home.getFile("src/jrunscript/jsh/test/jsh-data.jsh.js")],
							directory: jsh.shell.HOME,
							stdio: {
								output: String
							},
							evaluate: evaluate("inPath")
						});
						verify(output)["jsh.shell.jsh.home"].string.is(home.toString());
					})();
				}
			}

			fifty.tests.nashornDeprecation = function() {
				const { jsh } = fifty.global;

				const message = "Warning: Nashorn engine is planned to be removed from a future JDK release";

				var fixtures = (() => {
					var script: slime.jsh.wf.test.Script = fifty.$loader.script("../../tools/wf/test/fixtures.ts");
					var exported = script();
					return exported(fifty);
				})();

				var clean = fixtures.old.clone({
					src: fifty.jsh.file.relative("../..")
				}).directory.pathname.os.adapt();

				var installJdk: slime.jrunscript.shell.run.Intention = {
					command: "bash",
					arguments: [
						$api.fp.now(clean, jsh.file.Location.directory.relativePath("jsh"), $api.fp.property("pathname")),
						"--install-jdk-11"
					]
				};

				var runInBuiltShell: slime.jrunscript.shell.run.Intention = {
					command: "bash",
					arguments: [
						$api.fp.now(clean, jsh.file.Location.directory.relativePath("jsh"), $api.fp.property("pathname")),
						$api.fp.now(
							clean,
							jsh.file.Location.directory.relativePath("jrunscript/jsh/test/tools/run-in-built-shell.jsh.js"),
							$api.fp.property("pathname")
						),
						$api.fp.now(
							clean,
							jsh.file.Location.directory.relativePath("jrunscript/jsh/test/jsh-data.jsh.js"),
							$api.fp.property("pathname")
						)
					],
					stdio: {
						output: "string",
						error: "string"
					}
				};

				$api.fp.world.Means.now({
					means: jsh.shell.subprocess.action,
					order: installJdk
				});

				var result = $api.fp.world.Sensor.now({
					sensor: jsh.shell.subprocess.question,
					subject: runInBuiltShell
				});

				verify(result).status.is(0);
				verify(result).stdio.output.evaluate(function(string) { return string.indexOf(message) == -1; }).is(true);
				verify(result).stdio.error.evaluate(function(string) { return string.indexOf(message) == -1; }).is(true);
				if (result.status != 0) {
					jsh.shell.console("Directory: " + clean.pathname);
				}
			}

			fifty.tests.engineInstallation = fifty.test.Parent();

			var testLauncherEngineInstallation = function(engine) {
				var clean = fixtures.clone({
					src: fifty.jsh.file.relative("../..")
				});

				var run = function(intention: slime.jrunscript.shell.run.Intention) {
					return $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					})
				};

				var at = fifty.global.jsh.file.Location.directory.base(clean);

				var result = run({
					command: "bash",
					arguments: $api.Array.build(function(rv) {
						rv.push(at("jsh").pathname);
						rv.push(at("jrunscript/jsh/test/jsh-data.jsh.js").pathname);
					}),
					environment: function(base) {
						return fifty.global.$api.Object.compose(
							base,
							{ JSH_LAUNCHER_JDK_HOME: jsh.shell.java.Jdk.from.javaHome().base },
							{ JSH_ENGINE: engine || null }
						);
					},
					stdio: {
						output: "string"
					}
				});

				fifty.global.jsh.shell.console("clean = " + clean.pathname);

				fifty.verify(result).status.is(0);

				var json = JSON.parse(result.stdio.output);

				var expected = (engine) ? engine : "nashorn";

				fifty.verify(json.engines.current.name).evaluate(String).is(expected);
			}

			fifty.tests.engineInstallation.negative = function() {
				testLauncherEngineInstallation(null);
			}

			fifty.tests.engineInstallation.rhino = function() {
				testLauncherEngineInstallation("rhino");
			}

			fifty.tests.suite = function() {
				fifty.load("_.fifty.ts");
				fifty.run(fifty.tests.nashornDeprecation);
				fifty.run(fifty.tests.remote);
				fifty.run(fifty.tests.executable);
				fifty.run(fifty.tests.engineInstallation);
			}

			fifty.tests.manual = {};
			fifty.tests.manual.executable = function() {
				var run = function(intention: slime.jrunscript.shell.run.Intention) {
					return $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					})
				};

				var TMPDIR = fifty.jsh.file.temporary.location();

				run({
					command: fifty.jsh.file.relative("../../jsh").pathname,
					arguments: [
						"jrunscript/jsh/tools/shell.jsh.js",
						"build",
						"--destination", TMPDIR.pathname,
						"--engine", "rhino",
						"--executable"
					]
				});

				var it = run({
					command: $api.fp.now(TMPDIR, jsh.file.Location.directory.relativePath("jsh")).pathname,
					arguments: [
						fifty.jsh.file.relative("test/jsh-data.jsh.js").pathname
					],
					environment: function(env) {
						return $api.Object.compose(env, {
							//	TODO	detect Java being used to run this shell
							JSH_JAVA_HOME: fifty.jsh.file.relative("../../local/jdk/default").pathname,
							JSH_LAUNCHER_DEBUG: "1"
						});
					},
					stdio: {
						output: "string"
					}
				});
				jsh.shell.console("exit status = " + it.status);
				jsh.shell.console("output:");
				jsh.shell.console(it.stdio.output);

				jsh.shell.console("built = " + TMPDIR.pathname);
			}
		}
	//@ts-ignore
	)(fifty);
}
