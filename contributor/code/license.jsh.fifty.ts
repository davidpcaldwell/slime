//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.project.license {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const fixtures = (function() {
				var script: slime.jsh.wf.test.Script = fifty.$loader.script("../../tools/wf/test/fixtures.ts");
				return script({
					$api: fifty.global.$api,
					jsh: fifty.global.jsh
				});
			})();

			fifty.tests.issue495 = function() {
				//	TODO	fix this to allow Location rather than object
				var cloned = fixtures.clone({
					src: jsh.file.world.spi.filesystems.os.pathname(fifty.jsh.file.relative("../..").pathname),
					commit: {
						message: "Local modifications"
					}
				});
				cloned.directory.getRelativePath("a.js").write("", { append: false });
				var result = $api.fp.world.now.question(
					jsh.shell.world.question,
					jsh.shell.Invocation.create({
						command: cloned.directory.getRelativePath("jsh.bash"),
						arguments: $api.Array.build(function(rv) {
							rv.push(cloned.directory.getRelativePath("contributor/code/license.jsh.js"));
							rv.push("--fix");
						})
					})
				);
				jsh.shell.console("Output to " + cloned.directory);
				verify(result).status.is(0);
			}
		}
	//@ts-ignore
	)(fifty);

}
