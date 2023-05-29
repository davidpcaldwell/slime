//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.test.remote {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var slime = fifty.jsh.file.relative("../../..");

			var loader = jsh.file.world.Location.directory.loader.synchronous({ root: slime });

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

			var lock = jsh.java.Thread.Lock();

			var server = library.testing.startMock(jsh);

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
			)

			fifty.tests.suite = function() {
				var settings: slime.jsh.unit.mock.github.Settings = {
					mock: server,
					branch: "local"
				};

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
