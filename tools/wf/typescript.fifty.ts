//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.internal.module {
	export interface Exports {
		typescript: slime.jsh.wf.internal.typescript.Exports
	}
}

namespace slime.jsh.wf.internal.typescript {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			node: slime.jsh.shell.tools.node.Exports
		}

		world?: {
			filesystem?: slime.jrunscript.file.world.Filesystem
		}
	}

	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("typescript.js");
			return script({
				library: {
					file: fifty.global.jsh.file,
					shell: fifty.global.jsh.shell,
					node: fifty.global.jsh.shell.tools.node
				}
			});
		//@ts-ignore
		})(fifty);

		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("typescript.js");
			return {
				mockedFilesystem: function(fs: slime.jrunscript.file.world.Filesystem) {
					return script({
						library: {
							file: fifty.global.jsh.file,
							shell: fifty.global.jsh.shell,
							node: fifty.global.jsh.shell.tools.node
						},
						world: {
							filesystem: fs
						}
					});
				}
			};
		//@ts-ignore
		})(fifty);
	}

	export namespace typedoc {
		export interface Invocation {
			stdio: Parameters<slime.jrunscript.shell.Exports["Invocation"]["create"]>[0]["stdio"]

			configuration: {
				typescript: {
					version: string
					/**
					 * Pathname of the project file (for example, `tsconfig.json`, `jsconfig.json`).
					 */
					configuration: string
				}
			}

			/**
			 * The pathname of the project to document.
			 */
			project: string

			/**
			 * Destination to provide as the `out` configuration parameter.
			 */
			out?: string
		}
	}

	export interface Exports {
		/**
		 * Returns the default version of TypeScript.
		 */
		version: slime.$api.fp.impure.Input<string>
	}

	export interface Exports {
		Project: {
			typescriptVersion: (project: Project) => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.Project = function() {
				var fs = fifty.jsh.file.mock.fixtures().Filesystem.from.descriptor;

				var defaulted = test.fixtures.mockedFilesystem(fs({
					contents: {
						project: {
							contents: {}
						}
					}
				}))
				verify(defaulted).Project.typescriptVersion({
					base: "/project"
				}).is(defaulted.version());

				const VERSION = "4.8.4";
				var mock = fs({
					contents: {
						project: {
							contents: {
								"tsc.version": {
									text: VERSION
								}
							}
						}
					}
				});
				var specified = test.fixtures.mockedFilesystem(mock);
				var file = {
					filesystem: mock,
					pathname: "/project/tsc.version"
				};
				verify(specified).Project.typescriptVersion({
					base: "/project"
				}).is(VERSION);
			}
		}
	//@ts-ignore
	)(fifty);

	export interface Exports {
		typedoc: {
			invocation: (p: typedoc.Invocation) => slime.$api.fp.world.Question<
				{
					found: string
					notFound: void
					installing: string
					installed: string
				},
				slime.$api.fp.world.Sensor<
					slime.jrunscript.node.Installation,
					slime.jrunscript.shell.run.AskEvents,
					slime.jrunscript.shell.run.Exit
				>
			>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			};

			fifty.tests.manual = {};
			fifty.tests.manual.typedoc = {};
			fifty.tests.manual.typedoc.invocation = function() {
				const { jsh } = fifty.global;
				const { subject } = test;

				const out = fifty.jsh.file.temporary.location();
				const invocation = subject.typedoc.invocation({
					stdio: {},
					configuration: {
						typescript: {
							version: subject.version(),
							configuration: "jsconfig.json"
						}
					},
					project: fifty.jsh.file.relative("../..").pathname,
					out: out.pathname
				});
				jsh.shell.console(JSON.stringify(invocation));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
