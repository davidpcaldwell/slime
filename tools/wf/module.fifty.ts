//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf {
	export interface Project {
		base: string
	}
}

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

		export const write = (function(fifty: slime.fifty.test.Kit) {
			const { $api } = fifty.global;

			return function(filesystem: slime.jrunscript.file.world.spi.Filesystem, pathname: string, string: string) {
				var output = $api.fp.impure.now.input(
					$api.fp.world.input(
						filesystem.openOutputStream({
							pathname: pathname
						})
					)
				);
				if (output.present) {
					output.value.character().write(string);
					output.value.close();
				} else {
					throw new Error();
				}
			}
		//@ts-ignore
		})(fifty);
	}

	export interface Exports {
		Project: {
			getTypescriptVersion: (project: slime.jsh.wf.Project) => string
			getConfigurationLocation: (project: slime.jsh.wf.Project) => slime.jrunscript.file.world.Location
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify, run } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.suite = function() {
				var spi = fifty.global.jsh.file.mock.filesystem();
				var subject = test.mock(spi);
				var project: slime.jsh.wf.Project = {
					base: "/foo"
				};
				var version = subject.Project.getTypescriptVersion(project);
				verify(version).is("4.8.4");

				test.write(spi, "/foo/tsc.version", "9.9.9");

				var after = subject.Project.getTypescriptVersion(project);
				verify(after).is("9.9.9");

				run(function configuration() {
					var spi = fifty.global.jsh.file.mock.filesystem();
					var subject = test.mock(spi);
					var project: slime.jsh.wf.Project = {
						base: "/foo"
					};
					var error = false;
					try {
						var one = subject.Project.getConfigurationLocation(project);
					} catch (e) {
						error = true;
					}
					verify(error).is(true);

					test.write(spi, "/foo/jsconfig.json", "{}");
					var two = subject.Project.getConfigurationLocation(project);
					verify(two).pathname.is("/foo/jsconfig.json");

					test.write(spi, "/foo/tsconfig.json", "{}");
					var three = subject.Project.getConfigurationLocation(project);
					verify(three).pathname.is("/foo/tsconfig.json");
				})
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
