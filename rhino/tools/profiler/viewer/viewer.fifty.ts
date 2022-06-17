//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.profiler.viewer {
	export interface Settings {
		threshold: number
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual = {};

			fifty.tests.manual.viewer = function() {
				jsh.shell.world.run(
					jsh.shell.Invocation.create({
						command: jsh.shell.jsh.src.getRelativePath("jsh.bash").toString(),
						arguments: $api.Array.build(function(rv) {
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/tools/profile.jsh.js"));
							rv.push("--profiler:output:json", jsh.shell.jsh.src.getRelativePath("local/profiler/profiles.json"));
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/test/jsh-data.jsh.js"));
						})
					})
				)();
			}
		}
	//@ts-ignore
	)(fifty);

}
