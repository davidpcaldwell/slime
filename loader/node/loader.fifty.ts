//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Loading the `loader/node/loader.js` file via `require` from a SLIME source distribution will return a
 * {@link slime.node.Exports} object providing access to the SLIME runtime.
 */
namespace slime.node {
	export interface Exports {
		runtime: slime.runtime.Exports
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {
				fifty.global.jsh.shell.world.run(
					fifty.global.jsh.shell.Invocation.create({
						command: fifty.$loader.getRelativePath("test/main.bash"),
						stdio: {
							output: "string"
						}
					})
				)({
					exit: function(e) {
						fifty.verify(e.detail.stdio.output).is("3" + "\n");
					}
				});
			}
		}
	//@ts-ignore
	)(fifty);

}