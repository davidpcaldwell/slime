//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.loader.events {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			var shell = jsh.shell.jsh.Installation.from.current();
			if (!jsh.shell.jsh.Installation.is.unbuilt(shell)) throw new Error();
			var unbuilt = shell;

			fifty.tests.hello = function() {
				var intention: slime.jsh.shell.Intention = {
					shell: unbuilt,
					script: fifty.jsh.file.relative("main.jsh.js").pathname,
					stdio: {
						output: "string"
					}
				};
				var shellIntention = jsh.shell.jsh.Intention.toShellIntention(intention);
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					shellIntention
				);
				jsh.shell.console(JSON.stringify(shellIntention));
				verify(result.stdio.output.trim()).is("4");
			};

			fifty.tests.readfile = function() {
				var tmp = fifty.jsh.file.temporary.location();
				var strings = ["Hello", "World"];
				var action = fifty.global.jsh.file.Location.file.write.old(tmp).string({ value: strings.join("\n") + "\n" });
				var output = $api.fp.world.Action.process()(action);
				output();
				var intention: slime.jsh.shell.Intention = {
					shell: unbuilt,
					script: fifty.jsh.file.relative("readfile.jsh.js").pathname,
					arguments: [tmp.pathname],
					stdio: {
						output: "string"
					}
				};
				var shellIntention = jsh.shell.jsh.Intention.toShellIntention(intention);
				var result = $api.fp.world.now.question(
					jsh.shell.subprocess.question,
					shellIntention
				);
				jsh.shell.console(JSON.stringify(shellIntention));

				var json: { lines: string[] } = JSON.parse(result.stdio.output.trim());
				verify(json.lines).length.is(strings.length+1);
				for (var i=0; i<strings.length; i++) {
					verify(json.lines[i]).is(strings[i]);
				}
				verify(json.lines)[strings.length].is("");
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.hello);
				fifty.run(fifty.tests.readfile);
			}
		}
	//@ts-ignore
	)(fifty);
}
