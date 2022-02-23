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
		fs: {
			Loader: (p: {
				base: string
			}) => slime.Loader
		}
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
						var output: {
							identity: number
							loader: {
								type: string
								files: {
									me: {
										type: string
										content: string
									}
									foo: any
								}
							}
						} = JSON.parse(e.detail.stdio.output);

						fifty.verify(output).identity.is(3);
						fifty.verify(output).loader.type.is("object");
						fifty.verify(output).loader.files.me.type.is("object");
						fifty.verify(output).loader.files.me.content.is.type("string");
						fifty.verify(output).loader.files.foo.is(null);
					}
				});
			}
		}
	//@ts-ignore
	)(fifty);

}