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
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const { shells } = fixtures;

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

			fifty.tests.executable = function() {
				var shell = fixtures.shells.built(true);
				if (shell) {
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

			fifty.tests.suite = function() {
				var remoteShellLocalScript = run(shells.remote().getShellIntention({
					PATH: jsh.shell.PATH,
					settings: {
						branch: "local"
					},
					script: "jrunscript/jsh/test/jsh-data.jsh.js"
				}));
				jsh.shell.console(JSON.stringify(remoteShellLocalScript,void(0),4));
				verify(remoteShellLocalScript).evaluate.property("jsh.script.file").is.type("object");
				verify(remoteShellLocalScript).evaluate.property("jsh.script.url").is.type("undefined");

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

				fifty.run(fifty.tests.executable);
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
						"--rhino", fifty.jsh.file.relative("../../local/jsh/lib/js.jar").pathname,
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
