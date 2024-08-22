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
			var fixtures: slime.jsh.test.Script = fifty.$loader.script("../../../jrunscript/jsh/fixtures.ts");
			var exported = fixtures();
			var remote = exported.shells(fifty).remote();

			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

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
				var settings: slime.jsh.test.remote.Settings = {
					mock: remote.web,
					branch: "local"
				};

				//	When running remote shell from command line, we download the launcher script using curl and then pipe it
				//	to `bash`, hence the two step process below in which the first download is sent as input to the second
				//	command

				var download = remote.library.getDownloadJshBashCommand(
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

				var invoke = remote.library.getBashInvocationCommand(settings);
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
