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

			fifty.tests.suite = function() {
				var shell = jsh.shell.jsh.Installation.from.current();
				if (!jsh.shell.jsh.Installation.is.unbuilt(shell)) throw new Error();
				var intention: slime.jsh.shell.Intention = {
					shell: shell,
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
			}
		}
	//@ts-ignore
	)(fifty);
}
