//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.internal.module {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
		}

		world?: {
			filesystem?: slime.jrunscript.file.world.spi.Filesystem
		}
	}

	export namespace test {
		export const mock = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			return function(filesystem: slime.jrunscript.file.world.spi.Filesystem): Exports {
				return script({
					library: {
						file: fifty.global.jsh.file
					},
					world: {
						filesystem: filesystem
					}
				})
			}
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		Project: {
			getTypescriptVersion: (project: slime.jsh.wf.Project) => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var filesystem = fifty.global.jsh.file.mock.filesystem();
				var subject = test.mock(filesystem);
				var project: slime.jsh.wf.Project = {
					base: "/foo"
				};
				var version = subject.Project.getTypescriptVersion(project);
				verify(version).is("4.7.3");

				var output = $api.fp.impure.now.input(
					$api.fp.world.input(
						filesystem.openOutputStream({
							pathname: "/foo/tsc.version"
						})
					)
				);
				verify(output).present.is(true);
				if (output.present) {
					output.value.character().write("9.9.9");
					output.value.close();
				}
				var after = subject.Project.getTypescriptVersion(project);
				verify(after).is("9.9.9");
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
