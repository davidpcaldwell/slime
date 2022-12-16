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
				$api.fp.world.now.action(
					jsh.shell.world.action,
					jsh.shell.Invocation.from.argument({
						command: jsh.shell.jsh.src.getRelativePath("jsh.bash").toString(),
						arguments: $api.Array.build(function(rv) {
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/tools/profile.jsh.js").toString());
							rv.push("--profiler:output:json", jsh.shell.jsh.src.getRelativePath("local/profiler/profiles.json").toString());
							rv.push(jsh.shell.jsh.src.getRelativePath("jsh/test/jsh-data.jsh.js").toString());
						})
					})
				);
			}
		}
	//@ts-ignore
	)(fifty);

}
