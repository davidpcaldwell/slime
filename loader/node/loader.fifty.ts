//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Loading the `loader/node/loader.js` file via `require` from a SLIME source distribution will return a
 * {@link slime.node.Exports} object providing access to the SLIME runtime and to a filesystem-based {@link slime.Loader}
 * implementation.
 */
namespace slime.node {
	export interface Exports {
		/**
		 * The SLIME runtime, configured with the environment variables from this process which start with the
		 * (case-insensitive) `SLIME_` prefix. See the jrunscript runtime for details on the algorithm used to create the
		 * configuration.
		 */
		runtime: slime.runtime.Exports
		fs: {
			Loader: (p: {
				base: string
			}) => slime.Loader
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				$api.fp.world.now.action(
					jsh.shell.world.action,
					fifty.global.jsh.shell.Invocation.from.argument({
						command: fifty.jsh.file.object.getRelativePath("test/main.bash").toString(),
						stdio: {
							output: "string"
						}
					}),
					{
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

							const asObject = function(p: any) { return p as object; };

							fifty.verify(output).identity.is(3);
							fifty.verify(output).loader.type.is("object");
							fifty.verify(output).loader.files.me.type.is("object");
							fifty.verify(output).loader.files.me.content.is.type("string");
							fifty.verify(output).loader.files.foo.evaluate(asObject).is(null);
						}
					}
				);
			}
		}
	//@ts-ignore
	)(fifty);

}
