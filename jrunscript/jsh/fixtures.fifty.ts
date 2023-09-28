//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.jsh.test {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			const script: Script = fifty.$loader.script("fixtures.ts");
			return script();
		//@ts-ignore
		})(fifty);
	}
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.cache = fifty.test.Parent();

			fifty.tests.cache.built = function() {
				var built1 = test.subject.shells.built();
				var built2 = test.subject.shells.built();
				verify(built1).home.is(built2.home);
			};

			fifty.tests.cache.packaged = function() {
				var packaged1 = test.subject.shells.packaged();
				var packaged2 = test.subject.shells.packaged();
				verify(packaged1).is(packaged2);
			};

			fifty.tests.suite = function() {
				run(fifty.tests.cache);
			};

			fifty.tests.wip = function() {
				var slime = fifty.jsh.file.relative("../..");

				var loader = jsh.file.Location.directory.loader.synchronous({ root: slime });

				var code: {
					testing: slime.jrunscript.tools.github.internal.test.Script
				} = {
					testing: jsh.loader.synchronous.script("rhino/tools/github/test/module.js")(loader)
				};

				var library = {
					testing: code.testing({
						slime: jsh.file.object.directory(slime)
					})
				};

				var toInvocation = function(line: string[], input?: string, environment?: { [name: string]: string }) {
					if (!environment) environment = {};
					return jsh.shell.Invocation.from.argument({
						command: line[0],
						arguments: line.slice(1),
						environment: $api.Object.compose(
							jsh.shell.environment,
							environment
						),
						stdio: {
							input: input,
							output: "string",
							error: "string"
						}
					});
				};

				var getOutput = $api.fp.pipe(
					$api.fp.impure.tap(function(t) {
						debugger;
					}),
					$api.fp.world.mapping(jsh.shell.world.question),
					$api.fp.impure.tap(function(t) {
						if (t.status != 0) {
							jsh.shell.console("Exit status: " + t.status);
							jsh.shell.console("stderr:");
							jsh.shell.console(t.stdio.error);
						}
						debugger;
					}),
					$api.fp.property("stdio"),
					$api.fp.property("output")
				);

				var server = library.testing.startMock(jsh);

				//	TODO	duplicates jrunscript/jsh/test/remote.fifty.ts, which is in jrunscript suite; remove duplication
				var settings: slime.jsh.unit.mock.github.Settings = {
					mock: server,
					branch: "local"
				};

				//	When running remote shell from command line, we download the launcher script using curl and then pipe it
				//	to `bash`, hence the two step process below in which the first download is sent as input to the second
				//	command

				var download = library.testing.getDownloadJshBashCommand(
					jsh.shell.PATH,
					settings
				);
				jsh.shell.console("Downloading ...");
				jsh.shell.console(download.join(" "));
				var launcherBashScript = $api.fp.now.invoke(
					toInvocation(download),
					getOutput
				);
				jsh.shell.console("Script starts with:\n" + launcherBashScript.split("\n").slice(0,10).join("\n"));

				var invoke = library.testing.getBashInvocationCommand(settings);
				jsh.shell.console("Invoking ...");
				jsh.shell.console(invoke.join(" "));
				var scriptOutput = $api.fp.now.invoke(
					toInvocation(invoke, launcherBashScript, { JSH_LAUNCHER_BASH_DEBUG: "1", JSH_EMBED_BOOTSTRAP_DEBUG: "true" }),
					getOutput
				);

				if (!scriptOutput) throw new Error("No script output.");
				var output = JSON.parse(scriptOutput);
				verify(output).evaluate.property("engines").is.type("object");
				jsh.shell.console(JSON.stringify(output,void(0),4));
			}
		}
	//@ts-ignore
	)(fifty);
}
