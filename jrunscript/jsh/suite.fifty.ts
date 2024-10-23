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
			}
		}
	//@ts-ignore
	)(fifty);
}
