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

			var asShellIntention: slime.$api.fp.Identity<slime.jrunscript.shell.run.Intention> = $api.fp.identity;

			var getOutput = $api.fp.pipe(
				asShellIntention,
				$api.fp.impure.tap(function(t) {
					debugger;
				}),
				$api.fp.world.Sensor.old.mapping({
					sensor: jsh.shell.subprocess.question
				}),
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
				var settings: slime.jsh.test.shells.remote.Settings = {
					branch: "local"
				};

				debugger;
				var shellIntention = remote.getShellIntention({
					PATH: jsh.shell.PATH,
					settings: settings,
					script: "jrunscript/jsh/test/jsh-data.jsh.js"
				});

				var scriptOutput = $api.fp.now.invoke(
					shellIntention,
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
