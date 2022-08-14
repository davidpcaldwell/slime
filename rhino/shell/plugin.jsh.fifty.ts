//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var f = $api.Function.world.question(
					jsh.shell.world.question
				);
				var result = f(
					jsh.shell.Invocation.create({
						command: jsh.shell.jsh.src.getFile("jsh.bash"),
						arguments: [
							jsh.shell.jsh.src.getRelativePath("rhino/shell/test/stdio-close.jsh.js")
						],
						stdio: {
							output: "string",
							error: "string"
						}
					})
				);
				verify(result).status.is(0);
				verify(result).stdio.output.evaluate(JSON.parse).evaluate(function(json): boolean { return json.stderr.close; }).is(false);
				verify(result).stdio.error.is(["Hello, World!", "Hello, again!"].join("\n") + "\n");
			}
		}
	//@ts-ignore
	)(fifty);
}
